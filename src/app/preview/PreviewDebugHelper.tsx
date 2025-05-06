"use client";

import { useState, useEffect } from "react";

export default function PreviewDebugHelper() {
  const [debugInfo, setDebugInfo] = useState<{ key: string; value: string }[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const gatherDebugInfo = () => {
      const info: { key: string; value: string }[] = [];
      
      // Check browser capabilities
      info.push({ 
        key: "localStorage available", 
        value: typeof window !== "undefined" && window.localStorage ? "Yes" : "No" 
      });
      
      // Check if we have any preview data
      let previewData = null;
      try {
        previewData = localStorage.getItem("lessgo_preview_data");
        info.push({ 
          key: "Preview data exists", 
          value: previewData ? "Yes" : "No" 
        });
        
        if (previewData) {
          info.push({ 
            key: "Preview data length", 
            value: `${previewData.length} characters` 
          });
          
          try {
            const parsed = JSON.parse(previewData);
            info.push({ 
              key: "Data can be parsed", 
              value: "Yes" 
            });
            
            // Check if critical sections exist
            info.push({ 
              key: "Has hero data", 
              value: parsed.hero ? "Yes" : "No" 
            });
          } catch (e) {
            info.push({ 
              key: "Data can be parsed", 
              value: "No - " + (e instanceof Error ? e.message : String(e)) 
            });
          }
        }
      } catch (e) {
        info.push({ 
          key: "Error accessing localStorage", 
          value: e instanceof Error ? e.message : String(e) 
        });
      }
      
      setDebugInfo(info);
    };
    
    gatherDebugInfo();
    
    // Re-check every second
    const intervalId = setInterval(gatherDebugInfo, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (debugInfo.length === 0) return null;
  
  return (
    <div className="fixed bottom-16 right-4 z-50">
      <div 
        className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
        style={{ maxWidth: "400px" }}
      >
        <div 
          className="bg-gray-100 px-4 py-2 flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="font-medium text-sm">Preview Debug Info</h3>
          <span>{isExpanded ? "▼" : "▶"}</span>
        </div>
        
        {isExpanded && (
          <div className="p-4">
            <table className="w-full text-sm">
              <tbody>
                {debugInfo.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium">{item.key}:</td>
                    <td className="py-2">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="mt-4 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  localStorage.removeItem("lessgo_preview_data");
                  alert("Preview data cleared!");
                }}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200"
              >
                Clear Preview Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}