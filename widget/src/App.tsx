import { useState } from "react";
import { Intake } from "./Intake";
import { Results } from "./Results";
import { FeedbackModal } from "./FeedbackModal";
import type { StructuredVector, Recommendation } from "./types";

type Step = "intake" | "results" | "feedback";

interface AppProps {
  merchantId: string;
  apiBase: string;
}

export function App({ merchantId, apiBase }: AppProps) {
  const [step, setStep] = useState<Step>("intake");
  const [vector, setVector] = useState<StructuredVector | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [sessionId, setSessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const [feedbackProduct, setFeedbackProduct] = useState<Recommendation | null>(null);
  const [userProfileId, setUserProfileId] = useState<string>(sessionId);

  const track = async (eventType: string, productId?: string) => {
    try {
      await fetch(`${apiBase}/api/v1/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          session_id: sessionId,
          event_type: eventType,
          product_id: productId ?? null,
          payload: {},
        }),
      });
    } catch {
      // ignore
    }
  };

  const handleIntakeComplete = async (v: StructuredVector) => {
    setVector(v);
    track("intake_complete");

    try {
      const res = await fetch(`${apiBase}/api/v1/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          session_id: sessionId,
          structured_vector: v,
        }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      if (data.user_profile_id) setUserProfileId(data.user_profile_id);
      setStep("results");
      track("recommendation_view");
    } catch {
      setRecommendations([]);
      setStep("results");
    }
  };

  const handleFeedback = (rec: Recommendation) => {
    setFeedbackProduct(rec);
    setStep("feedback");
  };

  const handleFeedbackClose = () => {
    setFeedbackProduct(null);
    setStep("results");
    track("feedback_submit");
  };

  return (
    <div style={{ padding: "16px", maxWidth: "440px", margin: "0 auto" }}>
      {step === "intake" && (
        <Intake
          onComplete={handleIntakeComplete}
          onStart={() => track("intake_start")}
          apiBase={apiBase}
        />
      )}
      {step === "results" && (
        <Results
          recommendations={recommendations}
          onFeedback={handleFeedback}
          onAddToCart={(id) => track("add_to_cart", id)}
          onProductClick={(id) => track("product_click", id)}
        />
      )}
      {step === "feedback" && feedbackProduct && (
        <FeedbackModal
          product={feedbackProduct}
          onClose={handleFeedbackClose}
          apiBase={apiBase}
          sessionId={sessionId}
          userProfileId={userProfileId}
        />
      )}
    </div>
  );
}
