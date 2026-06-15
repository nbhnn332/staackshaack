/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((fieldName) => {
            let value = row[fieldName];
            if (value instanceof Date) {
              value = value.toISOString();
            } else if (typeof value === "object" && value !== null) {
              value = JSON.stringify(value);
            }
            // Double quote escape rules for CSV
            const escaped = ("" + (value ?? "")).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("CSV export failed:", error);
    alert("Export failed. Please try again.");
  }
}
