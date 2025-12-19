"""
Risk Calculation Service
"""
from app.models.asset import Asset
from app.models.threat import Threat


class RiskService:
    @staticmethod
    def calculate_risk_score(asset: Asset, threat: Threat) -> float:
        """
        Calculate risk score: Asset Sensitivity × Threat Likelihood × Threat Impact
        Normalized to 0-100 scale
        """
        sensitivity = float(asset.sensitivity_score)
        likelihood = float(threat.likelihood_score)
        impact = float(threat.impact_score)

        raw_score = sensitivity * likelihood * impact
        normalized = min(raw_score, 100.0)

        return round(normalized, 2)

    @staticmethod
    def get_risk_category(risk_score: float) -> str:
        """Categorize risk score"""
        if risk_score >= 75:
            return "Critical"
        elif risk_score >= 50:
            return "High"
        elif risk_score >= 25:
            return "Medium"
        else:
            return "Low"

