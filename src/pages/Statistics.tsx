import { useStatistics } from '@/hooks/useStatistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label, RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatisticsPage() {
    const { currentMonth, stats, netBalance, categoryPercentages } = useStatistics();
    const { t } = useTranslation();

    const chartConfig = {
        income: {
            label: t('income'),
            color: "hsl(var(--chart-2))",
        },
        expense: {
            label: t('expense'),
            color: "hsl(var(--chart-1))",
        },
        investment: {
            label: t('investment'),
            color: "hsl(var(--chart-3))",
        },
    } satisfies ChartConfig;

    const pieData = [
        { name: "income", value: stats.income, fill: "var(--color-income)" },
        { name: "expense", value: stats.expense, fill: "var(--color-expense)" },
        { name: "investment", value: stats.investment, fill: "var(--color-investment)" },
    ].filter(item => item.value > 0);

    const barData = stats.byCategory.map((item, index) => ({
        ...item,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
    }));

    // Sort categories by value for better visualization
    const sortedBarData = [...barData].sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('statistics')} ({currentMonth})</h1>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_income')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">+€{stats.income.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_expenses')}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">-€{stats.expense.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('investment')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">€{stats.investment.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('net_balance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {netBalance >= 0 ? '+' : ''}€{netBalance.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Pie Chart - Income vs Expense */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>{t('income_vs_expense')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[300px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    strokeWidth={5}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-2xl font-bold"
                                                        >
                                                            €{(stats.income + stats.expense + stats.investment).toFixed(0)}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            {t('total')}
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                                <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Radial Chart - Category Distribution */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>{t('category_distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        {categoryPercentages.length > 0 ? (
                            <ChartContainer
                                config={{}}
                                className="mx-auto aspect-square max-h-[300px]"
                            >
                                <RadialBarChart
                                    data={categoryPercentages.slice(0, 5)}
                                    innerRadius={30}
                                    outerRadius={110}
                                >
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel nameKey="name" />}
                                    />
                                    <PolarGrid gridType="circle" />
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar
                                        dataKey="value"
                                        background
                                        cornerRadius={10}
                                    />
                                    <ChartLegend content={<ChartLegendContent />} />
                                </RadialBarChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                {t('no_data')}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Horizontal Bar Chart - Expense Breakdown */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('expense_breakdown')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sortedBarData.length > 0 ? (
                            <ChartContainer config={{}} className="h-[400px] w-full">
                                <BarChart
                                    accessibilityLayer
                                    data={sortedBarData}
                                    layout="vertical"
                                    margin={{ left: 80, right: 20 }}
                                >
                                    <CartesianGrid horizontal={false} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <XAxis type="number" />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                {t('no_data')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
