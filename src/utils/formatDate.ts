// formatDate.ts placeholder

export const formatDate = (d?: Date | null) => {
    if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "dd/mm/yyyy";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};