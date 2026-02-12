from typing import Dict, Any
from jinja2 import Template
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Templates for different rule types
# A violation is the *inverse* of the rule condition
TEMPLATES = {
    "threshold": """
    SELECT * FROM {{ table }}
    WHERE {{ column }} {{ inverse_operator }} {{ value }}
    """,
    
    "date_difference": """
    SELECT * FROM {{ table }}
    WHERE ({{ date_col_2 }} - {{ date_col_1 }}) > {{ max_days }}
    """,
    
    "not_null": """
    SELECT * FROM {{ table }}
    WHERE {{ column }} IS NULL OR {{ column }} = ''
    """,
    
    "pattern": """
    SELECT * FROM {{ table }}
    WHERE {{ column }} !~ '{{ regex_pattern }}'
    """
}

# Operator inversion map (rule says >= 18, violation is < 18)
INVERSE_OPERATORS = {
    ">": "<=",
    "<": ">=",
    ">=": "<",
    "<=": ">",
    "=": "!=",
    "!=": "="
}

class QueryGenerator:
    def generate_violation_query(self, rule: Dict[str, Any]) -> str:
        """
        Translates a rule JSON object into a SQL query that finds VIOLATIONS.
        """
        try:
            rule_type = rule.get("rule_type")
            params = rule.get("parameters", {})
            
            if rule_type not in TEMPLATES:
                logger.warning(f"Unsupported rule type: {rule_type}")
                return None
                
            template_str = TEMPLATES[rule_type]
            template = Template(template_str)
            
            # Prepare context based on rule type
            context = params.copy()
            
            if rule_type == "threshold":
                op = params.get("operator", "=")
                context["inverse_operator"] = INVERSE_OPERATORS.get(op, "!=")
            
            # Additional logic for specific types...
            
            query = template.render(context)
            return query.strip()
            
        except Exception as e:
            logger.error(f"Error generating query for rule {rule}: {str(e)}")
            return None
