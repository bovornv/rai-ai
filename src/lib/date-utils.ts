// Thai date formatting utilities

const thaiMonths = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const thaiDays = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
];

export function formatThaiDate(date: Date = new Date()): string {
  const dayOfWeek = thaiDays[date.getDay()];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist Era
  
  return `${dayOfWeek} ${day} ${month} ${year}`;
}

export function formatThaiDateShort(date: Date = new Date()): string {
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = (date.getFullYear() + 543).toString().slice(-2); // Last 2 digits of Buddhist Era
  
  return `${day} ${month} ${year}`;
}

export function getCurrentThaiDate(): string {
  return formatThaiDate();
}

export function getCurrentThaiDateShort(): string {
  return formatThaiDateShort();
}

export function formatThaiDateTime(date: Date = new Date()): string {
  const thaiDate = formatThaiDate(date);
  const time = date.toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  return `${thaiDate} ${time}`;
}

export function formatThaiTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('th-TH', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}
