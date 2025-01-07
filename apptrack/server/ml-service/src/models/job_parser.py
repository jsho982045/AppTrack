# server/ml-service/src/models/job_parser.py
from typing import Dict, Optional
import spacy
from datetime import datetime

class JobParser:
    def __init__(self):
        # Load SpaCy's English model with named entity recognition
        self.nlp = spacy.load("en_core_web_lg")
        
    def parse_email(self, email_data: Dict) -> Dict:
        """
        Parse job application email and extract relevant information.
        
        Args:
            email_data: Dict containing email subject, content, and from fields
            
        Returns:
            Dict containing extracted company, position, and date
        """
        try:
            company = self._extract_company(
                email_data.get('subject', ''),
                email_data.get('content', ''),
                email_data.get('from', '')
            )
            
            position = self._extract_position(
                email_data.get('subject', ''),
                email_data.get('content', '')
            )
            
            return {
                'company': company or 'Unknown Company',
                'position': position or 'Position Not Found',
                'dateApplied': datetime.now().isoformat(),
                'status': 'applied',
                'confidence_score': self._calculate_confidence(company, position)
            }
        except Exception as e:
            print(f"Error parsing email: {e}")
            return None
            
    def _extract_company(self, subject: str, content: str, from_email: str) -> Optional[str]:
        """Extract company name using NER and pattern matching"""
        company_aliases = {
        "aws": "Amazon",
        "amazon aws": "Amazon",
        "amazon.com": "Amazon",
        "meta": "Meta",
        "facebook": "Meta",
        "google": "Google",
        "alphabet": "Google",
        "microsoft": "Microsoft",
        "msft": "Microsoft"
    }

        if from_email:
            domain = from_email.split('@')[-1].split('.')[0].lower()
            if domain in company_aliases:
                return company_aliases[domain]
        
        # Combine text for analysis
        combined_text = f"{subject}\n{content}"
        doc = self.nlp(combined_text)
        
        # Extract organizations using NER
        organizations = [ent.text for ent in doc.ents if ent.label_ == "ORG"]

        for org in organizations:
            org_lower = org.lower()
            if org_lower in company_aliases:
                return company_aliases[org_lower]
        
        if organizations:
            return organizations[0]
            
        text_lower = combined_text.lower()
        for alias, company in company_aliases.items():
            if alias in text_lower:
                return company 
            
        return None
        
    def _extract_position(self, subject: str, content: str) -> Optional[str]:
        """Extract job position using pattern matching and NER"""
        # Common job title patterns
        position_patterns = {
            "full_stack": [
                "Full Stack Developer",
                "Full-Stack Developer",
                "Fullstack Developer",
                "Full Stack Engineer",
                "Full-Stack Engineer",
                "Fullstack Engineer"
            ],
            "frontend": [
                "Frontend Developer",
                "Front End Developer",
                "Front-End Developer",
                "Frontend Engineer",
                "Front End Engineer",
                "Front-End Engineer",
                "UI Developer",
                "UI Engineer"
            ],
            "backend": [
                "Backend Developer",
                "Back End Developer",
                "Back-End Developer",
                "Backend Engineer",
                "Back End Engineer",
                "Back-End Engineer"
            ],
            "software": [
                "Software Engineer",
                "Software Developer",
                "SWE",
                "Software Development Engineer"
            ],
            "mobile": [
                "Mobile Developer",
                "Mobile Engineer",
                "iOS Developer",
                "Android Developer",
                "Mobile App Developer"
            ]
        }

        prefix_levels = [
            "Senior", "Lead", "Staff", "Principal", "Junior", "Entry-level",
            "Associate", "Mid-level", "Sr", "Sr.", "Jr", "Jr.","Intern"
        ]

        suffix_levels = ["I", "II", "III", "IV", "V"]

        text_to_search = f"{subject}\n{content}".lower()
        original_text = f"{subject}\n{content}"
        words = text_to_search.split()
        
        for category, patterns in position_patterns.items():
            for pattern in patterns:
                if pattern.lower() in text_to_search:
                    position_components = []
                    pattern_index = text_to_search.index(pattern.lower())
                    before_text = text_to_search[:pattern_index].split()
                    after_text = original_text[pattern_index:].split()

                    for level in prefix_levels:
                        if level.lower() in ' '.join(before_text[-3:]):
                            position_components.append(level)
                            break
                    position_components.append(pattern)

                    after_content = ' '.join(after_text)
                    print(f"After content: {after_content}")

                    for level in suffix_levels:
                        if f" {level} " in f" {after_content} ":
                            position_components.append(level)
                            print(f"Found level: {level}")  # Debug
                            break
                
                    print(f"Final components: {position_components}")  # Debug
                    return " ".join(position_components)
                    
      
        position_words = []
        keywords = ["developer", "engineer", "frontend", "backend", "full stack", 
                   "fullstack", "full-stack", "mobile", "ios", "android", "web",
                   "software", "swe", "development"]
        
        words = text_to_search.split()
        for i, word in enumerate(words):
            for level in prefix_levels:
                if level.lower() == word.lower():
                    position_words.append(level)

            if any(keyword in word for keyword in keywords):
                if i > 0 and words[i - 1] + " " + word in text_to_search:
                    position_words.append(words[i-1] + " " + word)
                else: 
                    position_words.append(word)

        if position_words:
            position = " ".join(position_words).strip()
            return " ".join(word.capitalize() for word in position.split())
        return None
        
        
    def _calculate_confidence(self, company: Optional[str], position: Optional[str]) -> float:
        """Calculate confidence score for the parsing results"""
        score = 0.0

        known_companies = {"Amazon", "Google", "Meta", "Microsoft", "Apple"}
        
        if company in known_companies:
            score += 0.6
        else:
            score += 0.4
        
        if position and position != "Position Not Found":
            score += 0.4
            
        return min(score, 1.0)
