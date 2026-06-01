export async function moderateContent(text) {
  try {
    // Prepare prompt in English for best model accuracy
    const prompt = `Analyze this ad text for any prohibited advertising content such as drugs, human trafficking, weapons, pornography, child pornography, prostitution, or other illegal or harmful content.

Return a JSON response in the following format:
{
  "containsProhibitedContent": boolean,
  "prohibitedCategories": ["category1", "category2"],
  "explanation": "brief explanation of what was detected"
}

Text:
"""
${text}
"""`;

    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: prompt })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Moderation API error:", error);
      throw new Error("Moderation failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Content moderation failed:", error);
    return {
      containsProhibitedContent: false,
      prohibitedCategories: [],
      explanation: "Content moderation service unavailable."
    };
  }
}