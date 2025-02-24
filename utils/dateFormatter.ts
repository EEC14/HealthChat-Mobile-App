// Create a new file: app/utils/dateFormatter.ts

export function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
  
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }