import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { SyncStatusBadge } from '@/components/SyncStatus';
import { Transaction, Category } from '@/lib/db';
import { useMobile } from '@/hooks/useMobile';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getIconComponent } from '@/lib/icons';

interface TransactionListProps {
    transactions: Transaction[] | undefined;
    categories: Category[] | undefined;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: string) => void;
    showActions?: boolean;
    isLoading?: boolean;
}

export function TransactionList({ transactions, categories, onEdit, onDelete, showActions = true, isLoading = false }: TransactionListProps) {
    const { t } = useTranslation();
    const isMobile = useMobile();

    const categoryMap = useMemo(() => {
        const map = new Map<string, Category>();
        categories?.forEach(c => {
            map.set(c.id, c);
        });
        return map;
    }, [categories]);

    const getCategory = (id?: string) => {
        if (!id) return undefined;
        return categoryMap.get(id);
    };

    const getTypeTextColor = (type: string) => {
        switch (type) {
            case 'expense': return 'text-red-500';
            case 'income': return 'text-green-500';
            case 'investment': return 'text-blue-500';
            default: return '';
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return <div className="text-muted-foreground text-center py-4">{t('no_transactions')}</div>;
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                {transactions.map((t_item, index) => {
                    const category = getCategory(t_item.category_id);
                    const IconComp = category?.icon ? getIconComponent(category.icon) : null;
                    return (
                        <div
                            key={t_item.id}
                            className={`rounded-lg border bg-card p-4 shadow-sm ${index < 20 ? 'animate-slide-in-up opacity-0 fill-mode-forwards' : ''}`}
                            style={index < 20 ? { animationDelay: `${index * 0.05}s` } : {}}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-sm text-muted-foreground">{t_item.date}</div>
                                <div className={`font-bold ${getTypeTextColor(t_item.type)}`}>
                                    {t_item.type === 'expense' ? '-' : t_item.type === 'investment' ? '' : '+'}€{t_item.amount.toFixed(2)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">{t_item.description || '-'}</div>
                                <SyncStatusBadge isPending={t_item.pendingSync === 1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center gap-1">
                                    {IconComp && <IconComp className="h-3 w-3" />}
                                    <span>{category?.name || '-'}</span>
                                </div>
                                {showActions && (
                                    <div className="flex gap-2">
                                        {onEdit && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(t_item)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(t_item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('date')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead>{t('type')}</TableHead>
                        <TableHead className="text-right">{t('amount')}</TableHead>
                        {showActions && <TableHead></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t_item, index) => {
                        const category = getCategory(t_item.category_id);
                        const IconComp = category?.icon ? getIconComponent(category.icon) : null;
                        return (
                            <TableRow
                                key={t_item.id}
                                className={index < 20 ? "animate-slide-in-up opacity-0 fill-mode-forwards" : ""}
                                style={index < 20 ? { animationDelay: `${index * 0.03}s` } : {}}
                            >
                                <TableCell>{t_item.date}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {t_item.description}
                                        <SyncStatusBadge isPending={t_item.pendingSync === 1} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {IconComp && <IconComp className="h-4 w-4" />}
                                        <span>{category?.name || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="capitalize">
                                    {t(t_item.type)}
                                </TableCell>
                                <TableCell className={`text-right ${getTypeTextColor(t_item.type)}`}>
                                    {t_item.type === 'expense' ? '-' : t_item.type === 'investment' ? '' : '+'}€{t_item.amount.toFixed(2)}
                                </TableCell>
                                {showActions && (
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <Button variant="ghost" size="icon" onClick={() => onEdit(t_item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button variant="ghost" size="icon" onClick={() => onDelete(t_item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
