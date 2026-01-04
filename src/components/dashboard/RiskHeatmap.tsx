import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import apiService from "@/services/api";
import { API_ENDPOINTS } from "@/config/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RiskHeatmapData {
  likelihood: number;
  impact: number;
  count: number;
  risk: string;
}

const getRiskColor = (risk: string, count: number) => {
  if (count === 0) return "bg-muted/30";
  switch (risk) {
    case "critical":
      return "bg-critical/80 hover:bg-critical";
    case "high":
      return "bg-high/80 hover:bg-high";
    case "medium":
      return "bg-medium/80 hover:bg-medium";
    case "low":
      return "bg-low/80 hover:bg-low";
    default:
      return "bg-muted/50";
  }
};

export function RiskHeatmap() {
  const [heatmapData, setHeatmapData] = useState<RiskHeatmapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const impactLabels = ["Very Low", "Low", "Medium", "High", "Very High"];
  const likelihoodLabels = ["Rare", "Unlikely", "Possible", "Likely", "Certain"];

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.get<RiskHeatmapData[]>(API_ENDPOINTS.threats.riskHeatmap);
        setHeatmapData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load risk heatmap data");
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Risk Heatmap</h3>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Risk Heatmap</h3>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Risk Heatmap</h3>
      
      <div className="flex gap-4">
        {/* Y-axis label */}
        <div className="flex flex-col justify-center items-center">
          <span className="text-xs font-medium text-muted-foreground -rotate-90 whitespace-nowrap">
            Likelihood →
          </span>
        </div>

        <div className="flex-1">
          {/* Heatmap grid */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[5, 4, 3, 2, 1].map((likelihood) =>
              [1, 2, 3, 4, 5].map((impact) => {
                const cell = heatmapData.find(
                  (d) => d.likelihood === likelihood && d.impact === impact
                );
                return (
                  <div
                    key={`${likelihood}-${impact}`}
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer",
                      getRiskColor(cell?.risk || "", cell?.count || 0),
                      cell?.count ? "text-background" : "text-muted-foreground"
                    )}
                    title={`Likelihood: ${likelihoodLabels[likelihood - 1]}, Impact: ${impactLabels[impact - 1]}, Threats: ${cell?.count || 0}`}
                  >
                    {cell?.count || ""}
                  </div>
                );
              })
            )}
          </div>

          {/* X-axis labels */}
          <div className="grid grid-cols-5 gap-1 mt-3">
            {impactLabels.map((label) => (
              <div key={label} className="text-[10px] text-center text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="text-xs text-center text-muted-foreground mt-1">Impact →</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
        {[
          { label: "Low", color: "bg-low" },
          { label: "Medium", color: "bg-medium" },
          { label: "High", color: "bg-high" },
          { label: "Critical", color: "bg-critical" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded", color)} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
