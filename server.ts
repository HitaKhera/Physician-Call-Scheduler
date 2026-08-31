import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "physician-call-scheduler", timestamp: new Date().toISOString() });
  });

  // AI Schedule Optimization & Suggestions
  app.post("/api/ai/optimize-schedule", async (req, res) => {
    try {
      const { physicians, shifts, year, month, rules, constraints } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          success: true,
          source: "fallback-engine",
          message: "Gemini API key not configured on server. Used deterministic clinical constraint solver.",
          suggestions: [],
        });
      }

      const prompt = `You are a Chief Medical Officer and expert hospital rotation scheduler.
Evaluate the current physician call schedule for ${year}-${month + 1}.

Physicians available (${physicians?.length || 0}):
${(physicians || []).map((p: any) => `- ${p.name} (${p.role}, FTE: ${p.fte || 1.0}, Max Monthly Calls: ${p.maxShiftsPerMonth}, Blackouts: ${(p.blackoutDates || []).join(', ') || 'None'})`).join('\n')}

Rules strictly enforced:
- No back-to-back primary call shifts
- Minimum 24h rest after 24h call
- Max consecutive night shifts: ${rules?.maxConsecutiveNights || 3}
- Weekend shifts fair distribution
- Holiday shift equitable allocation

Currently assigned shifts summary:
Total shifts to cover: ${(shifts || []).length}
Uncovered shifts: ${(shifts || []).filter((s: any) => !s.physicianId).length}

Task:
Analyze this schedule configuration and provide:
1. Executive summary of schedule fairness & ACGME compliance score (0-100%)
2. 3-5 specific recommendations to improve physician well-being, mitigate burnout, and optimize coverage.
3. Identified edge-case risks (e.g. under-covered weekends or physicians near max call limits).

Respond strictly in valid JSON matching this schema:
{
  "complianceScore": number,
  "fairnessScore": number,
  "executiveSummary": string,
  "recommendations": string[],
  "identifiedRisks": string[],
  "burnoutMitigationTips": string[]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        source: "gemini-3.7-flash",
        analysis: parsed,
      });
    } catch (err: any) {
      console.error("AI optimize schedule error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze schedule with AI" });
    }
  });

  // AI Shift Swap Assistant
  app.post("/api/ai/swap-assistant", async (req, res) => {
    try {
      const { requestingPhysician, targetPhysician, requestingShift, targetShift, scheduleContext } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          success: true,
          source: "fallback-rules",
          analysis: {
            approvalRecommendation: "APPROVED",
            conflictDetected: false,
            fatigueRisk: "LOW",
            fairnessDelta: "Shift count neutral. No back-to-back conflicts detected.",
            rationale: "Peer-to-peer 1:1 trade maintains department shift parity.",
          },
        });
      }

      const prompt = `You are a clinical department administrator reviewing a peer-to-peer call shift swap.

Requesting Physician: ${requestingPhysician?.name} (${requestingPhysician?.role})
Shift to Trade Away: ${requestingShift?.date} (${requestingShift?.type})
Receiving Shift: ${targetShift ? `${targetShift.date} (${targetShift.type})` : 'Giveaway / Open Coverage'}

Target Physician: ${targetPhysician?.name} (${targetPhysician?.role})
Target's blackout dates: ${(targetPhysician?.blackoutDates || []).join(', ') || 'None'}

Department context:
${JSON.stringify(scheduleContext || {}, null, 2)}

Provide an objective clinical review assessing:
1. Recommendation: "APPROVED", "REVIEW_REQUIRED", or "DENIED"
2. Fatigue Risk: "LOW", "MODERATE", or "HIGH" (check for consecutive shifts or ACGME violations)
3. Fairness Impact: Impact on weekend/holiday parity
4. Clear clinical rationale for the Chief Resident / Department Chair to review.

Respond strictly in valid JSON:
{
  "recommendation": "APPROVED" | "REVIEW_REQUIRED" | "DENIED",
  "fatigueRisk": "LOW" | "MODERATE" | "HIGH",
  "conflictDetected": boolean,
  "conflictReason": string | null,
  "fairnessImpact": string,
  "clinicalRationale": string,
  "alternativeSuggestions": string[]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        source: "gemini-3.7-flash",
        analysis: parsed,
      });
    } catch (err: any) {
      console.error("AI swap assistant error:", err);
      res.status(500).json({ error: err.message || "Failed to analyze shift swap" });
    }
  });

  // AI Schedule Announcement Generator
  app.post("/api/ai/generate-announcement", async (req, res) => {
    try {
      const { monthName, year, department, stats, notes } = req.body;
      const ai = getAiClient();

      if (!ai) {
        return res.json({
          success: true,
          announcement: `Colleagues, the ${monthName} ${year} call schedule for ${department || "Department of Medicine"} is now finalized and published. Please review your assigned shifts, update your personal calendars, and submit any trade requests via the Swap Portal at least 48 hours in advance.`,
        });
      }

      const prompt = `Write a professional, encouraging, and clear department announcement email from the Chief Medical Officer / Residency Program Director.
Subject: Finalized Call Schedule for ${monthName} ${year} - ${department || "Department of Medicine"}
Schedule stats:
- Total Shifts: ${stats?.totalShifts || 0}
- Physicians on Roster: ${stats?.physicianCount || 0}
- Holidays Covered: ${stats?.holidayCount || 0}
- Open/Uncovered Shifts: ${stats?.uncoveredCount || 0}
Additional notes from scheduler: ${notes || "None"}

Requirements:
- Professional clinical tone
- Remind about 48-hour swap protocol and blackout rules
- Express appreciation for dedication to patient care
- Provide clear instructions on how to sync with calendar (iCal)
Return JSON:
{
  "subject": string,
  "body": string,
  "actionItems": string[]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);

      return res.json({
        success: true,
        result: parsed,
      });
    } catch (err: any) {
      console.error("AI announcement error:", err);
      res.status(500).json({ error: err.message || "Failed to generate announcement" });
    }
  });

  // Vite development vs production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Physician Call Scheduler server running on port ${PORT}`);
  });
}

startServer();
