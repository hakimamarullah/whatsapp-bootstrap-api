export const normalizePhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned?.startsWith('08')) {
        cleaned = '62' + cleaned.substring(1)
    }

    return `${cleaned}@c.us`;
}

export const maskString = (str: string, visibleCount: number) => {
    return str.slice(0, visibleCount - 1) + '*'.repeat(str.length - visibleCount - 1) + str.slice(-1);
}