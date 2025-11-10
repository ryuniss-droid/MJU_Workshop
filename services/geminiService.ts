import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, RelationalFrameworkInput, GeneratedKeywordsResponse, KeywordPair } from "../types";
import { DOMAIN_OPTIONS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

function formatMissionStatement(missionStatement: UserInput['missionStatement']): string {
  const parts = [
    missionStatement.companyOrProject && `Company/Project: ${missionStatement.companyOrProject}`,
    missionStatement.vision && `Vision (Why): ${missionStatement.vision}`,
    missionStatement.challenge && `Challenge (What): ${missionStatement.challenge}`,
    missionStatement.approach && `Approach (How): ${missionStatement.approach}`,
    missionStatement.valueProposition && `Value Proposition (Impact): ${missionStatement.valueProposition}`
  ].filter(Boolean);

  if (parts.length === 0) return "";
  return "\nHere is the project's mission statement:\n- " + parts.join('\n- ');
}

function getDomainDefinitions(): string {
    let definitions = "Here are the definitions for the design domains based on the World Design Organization (WDO) framework:\n";
    DOMAIN_OPTIONS.forEach(domain => {
        definitions += `- **${domain.label}**: ${domain.description}\n`;
    });
    return definitions;
}


function buildPrompt(userInput: UserInput, framework: RelationalFrameworkInput): string {
    const selectedDomain = DOMAIN_OPTIONS.find(d => d.value === userInput.domain);

    let prompt = `You are an expert design strategist specializing in relational keywords. Your task is to generate a palette of abstract, experiential keywords for a design project.

**IMPORTANT RULE:** Do NOT include keywords related to specific materials (e.g., wood, glass), rendering styles (e.g., hyper-realistic, 4k), or lighting (e.g., cinematic lighting). Focus ONLY on abstract, relational, and experiential concepts.

**STEP 1: UNDERSTAND THE PROJECT CONTEXT**

*   **Design Domain:** The project is in the **${selectedDomain?.label}** domain.
    *   *Definition*: ${selectedDomain?.description}
${formatMissionStatement(userInput.missionStatement)}

**STEP 2: APPLY THE RELATIONAL FRAMEWORK**

The designer has chosen the following framework to guide the creative direction:
*   **Core Relationship Axes:** ${framework.relationshipAxes.join(', ')}
*   **Selected Sub-Categories of Focus:** ${framework.selectedSubCategories.join(', ')}
*   **Temporal Focus (When the interaction occurs):** ${framework.temporality.join(', ')}
*   **Spatial Scope (Physical scale of the relationship):** ${framework.spatialScope.join(', ')}

**STEP 3: GENERATE THE KEYWORD PALETTE**

Based on all the information above, generate a large, diverse list of abstract and relational keywords in English. For each English keyword, you MUST also provide its accurate Korean translation. Distribute them into the following four categories. Provide 15-20 keyword pairs per category.

1.  **Actional Keywords:** Words describing actions, interactions, and transformations.
2.  **Sensory Keywords:** Words describing multi-sensory experiences and atmospheric qualities.
3.  **Symbolic Keywords:** Words describing abstract concepts, emotional connections, and metaphorical relationships.
4.  **Thematic Keywords:** Words describing the core design intention, overarching theme, or emotional goal, derived from the mission statement and framework.

Return the result as a single JSON object. Each category should be an array of objects, where each object has two keys: "en" for the English keyword and "ko" for the Korean translation.
`;
    return prompt;
}

export const generateKeywords = async (
  userInput: UserInput,
  framework: RelationalFrameworkInput
): Promise<GeneratedKeywordsResponse> => {
    
    const model = 'gemini-2.5-pro';
    
    const promptText = buildPrompt(userInput, framework);
    
    const parts: any[] = [{ text: promptText }];

    try {
        const keywordPairSchema = {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                ko: { type: Type.STRING }
            },
            required: ["en", "ko"]
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        actional: {
                            type: Type.ARRAY,
                            items: keywordPairSchema,
                        },
                        sensory: {
                            type: Type.ARRAY,
                            items: keywordPairSchema,
                        },
                        symbolic: {
                            type: Type.ARRAY,
                            items: keywordPairSchema,
                        },
                        thematic: {
                            type: Type.ARRAY,
                            items: keywordPairSchema,
                        },
                    },
                    required: ["actional", "sensory", "symbolic", "thematic"]
                },
            },
        });
        
        const text = response.text;
        const result = JSON.parse(text);

        if (result.actional && result.sensory && result.symbolic && result.thematic) {
            return result;
        } else {
            throw new Error("Invalid response format from API.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate keywords: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating keywords.");
    }
};

export const translateKeywords = async (englishKeywords: string[]): Promise<KeywordPair[]> => {
    if (englishKeywords.length === 0) {
        return [];
    }
    const model = 'gemini-2.5-flash';
    const prompt = `Translate the following list of English keywords into Korean.
    
    English Keywords:
    ${englishKeywords.join(', ')}
    
    Return the result as a single JSON object with a key "translations" which is an array of objects. Each object must have two keys: "en" for the original English keyword and "ko" for its Korean translation. Maintain the original order.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    en: { type: Type.STRING },
                                    ko: { type: Type.STRING },
                                },
                                required: ['en', 'ko'],
                            },
                        },
                    },
                    required: ['translations'],
                },
            },
        });
        const text = response.text;
        // FIX: Cast the result of JSON.parse to a specific type to ensure type safety,
        // which resolves an issue where the 'ko' property was being inferred as 'unknown'.
        const result = JSON.parse(text) as { translations: KeywordPair[] };
        
        if (result.translations && Array.isArray(result.translations)) {
             // Gemini might return translations in a different order, so we need to map them back
             const translationMap = new Map(result.translations.map((item: KeywordPair) => [item.en.toLowerCase().trim(), item.ko]));
             return englishKeywords.map(en => ({
                 en,
                 ko: translationMap.get(en.toLowerCase().trim()) || ''
             }));
        } else {
            throw new Error('Invalid response format for translation.');
        }
    } catch (error) {
        console.error("Error calling Gemini API for translation:", error);
         // As a fallback, return the English keywords with empty Korean translations
        return englishKeywords.map(en => ({ en, ko: '번역 실패' }));
    }
};

export const generateImageDescriptions = async (imageBase64: string, imageMimeType: string): Promise<string[]> => {
    const model = 'gemini-2.5-flash';
    const prompt = `As a designer, analyze this image. Provide four distinct, evocative descriptions focusing on:
1.  **Mood & Emotion:** The overall feeling and emotional atmosphere.
2.  **Form & Shape:** The dominant shapes, structures, and lines.
3.  **Texture & Materiality:** The tactile qualities and implied materials.
4.  **Interaction & Experience:** How a person might interact with or experience this.

Return the result as a JSON object with a single key "descriptions" which is an array of exactly four strings.`;

    try {
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        descriptions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                    required: ['descriptions'],
                },
            },
        });
        const text = response.text;
        const result = JSON.parse(text);
        if (result.descriptions && Array.isArray(result.descriptions) && result.descriptions.length > 0) {
            // Ensure exactly 4 descriptions, padding with empty strings if necessary
            const descriptions = result.descriptions.slice(0, 4);
            while (descriptions.length < 4) {
                descriptions.push('');
            }
            return descriptions;
        } else {
            throw new Error('Invalid description format from API.');
        }

    } catch (error) {
        console.error("Error generating image descriptions:", error);
        return Array(4).fill("AI description failed.");
    }
};


export const extractAndCategorizeKeywordsFromText = async (text: string): Promise<{ abstract: KeywordPair[], concrete: KeywordPair[] }> => {
    if (!text.trim()) {
        return { abstract: [], concrete: [] };
    }
    const model = 'gemini-2.5-flash';
    const prompt = `Analyze the following text. Extract the most important and distinct keywords useful for a design project.
Categorize each keyword as either 'abstract' (추상적) or 'concrete' (구상적).
- Abstract keywords relate to feelings, concepts, experiences, or qualities (e.g., serene, dynamic, connection).
- Concrete keywords relate to physical objects, forms, or tangible elements (e.g., sphere, wood, twisted lines).

For each English keyword you extract, you MUST also provide its accurate Korean translation.

**Input Text:**
"${text}"

Return a single JSON object with two keys: "abstract" and "concrete". Each key should contain an array of objects. Each object must have two keys: "en" for the English keyword and "ko" for the Korean translation. Do not extract more than 10 keywords per category.`;

    try {
        const keywordPairSchema = {
            type: Type.OBJECT,
            properties: {
                en: { type: Type.STRING },
                ko: { type: Type.STRING }
            },
            required: ["en", "ko"]
        };

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        abstract: {
                            type: Type.ARRAY,
                            items: keywordPairSchema
                        },
                        concrete: {
                            type: Type.ARRAY,
                            items: keywordPairSchema
                        }
                    },
                    required: ["abstract", "concrete"]
                },
            },
        });
        const responseText = response.text;
        const result = JSON.parse(responseText);
        if (result.abstract && result.concrete && Array.isArray(result.abstract) && Array.isArray(result.concrete)) {
            return result;
        } else {
            throw new Error('Invalid response format from keyword extraction.');
        }
    } catch (error) {
        console.error("Error extracting and categorizing keywords:", error);
        return { abstract: [], concrete: [] };
    }
};