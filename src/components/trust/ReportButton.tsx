// NOTE: Report functionality is disabled until the user_reports table is created
// The database migration for this feature needs to be applied first

interface ReportButtonProps {
    userId: string;
    userName?: string;
    variant?: 'icon' | 'text';
}

export function ReportButton({ userId, userName = 'this user', variant = 'icon' }: ReportButtonProps) {
    // Disabled until database table is created
    return null;
}
