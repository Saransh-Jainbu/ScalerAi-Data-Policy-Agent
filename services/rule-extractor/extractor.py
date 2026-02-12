import spacy
import ollama
import json
import logging
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RuleExtractor:
    def __init__(self, model_name: str = "llama3.1:8b"):
        # Load spaCy model for entity extraction
        logger.info("Initializing spaCy...")
        self.nlp = spacy.load("en_core_web_sm")
        self.model_name = model_name
        logger.info(f"Using Ollama model: {self.model_name}")

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract relevant entities using spaCy (NER).
        This helps ground the LLM's understanding.
        """
        doc = self.nlp(text)
        entities = {
            "dates": [],
            "money": [],
            "orgs": [],
            "laws": []
        }
        
        for ent in doc.ents:
            if ent.label_ == "DATE":
                entities["dates"].append(ent.text)
            elif ent.label_ == "MONEY":
                entities["money"].append(ent.text)
            elif ent.label_ in ["ORG", "GPE"]:
                entities["orgs"].append(ent.text)
            elif ent.label_ == "LAW":
                entities["laws"].append(ent.text)
                
        return entities

    def extract_rule(self, text: str, document_id: str) -> Dict[str, Any]:
        """
        Main logic: Combine spaCy entities with LLM reasoning.
        """
        # 1. Get entities from spaCy
        entities = self.extract_entities(text)
        
        # 2. Construct Prompt for Ollama
        prompt = f"""
        You are an expert compliance officer. Extract a structured compliance rule from the following policy text.

        Text: "{text}"
        
        The extracted rule must be actionable in a database.
        
        Return ONLY valid JSON in this format:
        {{
            "rule_name": "Short descriptive name",
            "rule_type": "threshold|date_difference|not_null|pattern|role_based",
            "description": "Clear explanation of the rule",
            "parameters": {{ ...rule specific logic... }},
            "confidence_score": 0.0 to 1.0 (float)
        }}

        Extracted Entities (for context): {json.dumps(entities)}

        Constraint: If no clear rule exists, return null.
        """

        try:
            # 3. Call Ollama (Local API)
            logger.info("Generating with Ollama...")
            response = ollama.chat(model=self.model_name, messages=[
                {
                    'role': 'user',
                    'content': prompt,
                },
            ])
            
            # 4. Parse JSON response
            content = response['message']['content']
            
            # Basic cleanup if model adds markdown blocks
            content = content.replace("```json", "").replace("```", "").strip()
            
            rule_data = json.loads(content)
            
            if not rule_data:
                logger.warning("Model returned empty rule.")
                return None

            # Add metadata
            rule_data["source_document"] = document_id
            rule_data["source_text_snippet"] = text[:200]
            
            return rule_data
            
        except Exception as e:
            logger.error(f"Error extracting rule: {str(e)}")
            return None

if __name__ == "__main__":
    # Test locally
    extractor = RuleExtractor()
    test_text = "Employees must complete cybersecurity training within 30 days of joining the company."
    print(json.dumps(extractor.extract_rule(test_text, "test-doc-1"), indent=2))
