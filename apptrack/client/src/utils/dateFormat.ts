export function formatDateToEST(date: Date | string, includeTime: boolean = false): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        ...(includeTime && {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };

    return new Date(date).toLocaleString('en-US', options);
}