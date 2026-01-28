import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartWithLegendProps {
  data: PieDataItem[];
  delay?: number;
}

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function PieChartWithLegend({ data, delay = 0 }: PieChartWithLegendProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card
      className="border rounded-xl shadow-sm animate-fade-in h-full flex flex-col"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <PieChartIcon className="w-4 h-4" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {data.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 h-full">
            {/* Chart */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="transition-all duration-200"
                        style={{
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full md:w-auto md:min-w-[180px]">
              <div className="space-y-2 overflow-y-auto flex-1">
                {data.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer",
                        activeIndex === index
                          ? "bg-muted/80"
                          : "hover:bg-muted/50"
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(item.value)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <PieChartIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhuma despesa registrada</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
