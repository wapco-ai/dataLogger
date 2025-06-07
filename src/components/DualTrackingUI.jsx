
	      <!DOCTYPE html>
<html>
  <head>
    <title>CodeSandbox</title>

    <script type="importmap">
      {"imports":{"react":"https://esm.sh/react@18.3.1","react-dom":"https://esm.sh/react-dom@18.3.1","react/jsx-runtime":"https://esm.sh/react@18.3.1/jsx-runtime","react-dom/client":"https://esm.sh/react-dom@18.3.1/client","tailwindcss/defaultTheme":"https://esm.sh/tailwindcss/defaultTheme","tailwindcss-animate":"https://esm.sh/tailwindcss-animate"}}
    </script>

    <script>
      window.addEventListener("error", function (event) {
        const errorObj = {
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null
        };
        window.parent.postMessage(
          { action: "error", error: JSON.stringify(errorObj) },
          "*"
        );
        event.preventDefault();
      });

  function handleImportError(error) {
    throw new Error('Import module failed: ' + error.target.src);
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'SCRIPT' && node.type === 'module') {
          node.onerror = handleImportError;
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.querySelectorAll('script[type="module"]').forEach(script => {
    script.onerror = handleImportError;
  });

  
window.console = new Proxy(console, {
  get(target, prop) {
    if (['log', 'warn', 'error'].includes(prop)) {
      return new Proxy(target[prop], {
        apply(fn, thisArg, args) {
          fn.apply(thisArg, args);
          window.parent.postMessage({ action: 'console', 
            type: prop, 
            args: args.map((arg) => {
              try {
                return JSON.stringify(arg).replace(/^["']|["']$/g, '');
              } catch (e) {
                return arg;
              }
            }) 
          }, '*');
        }
      });
    }
    return target[prop];
  }
});


    </script>
    <!-- tailwindcss script -->
    <style type="text/tailwindcss">
      @layer base {
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 47.4% 11.2%;

          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;

          --popover: 0 0% 100%;
          --popover-foreground: 222.2 47.4% 11.2%;

          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;

          --card: 0 0% 100%;
          --card-foreground: 222.2 47.4% 11.2%;

          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;

          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;

          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;

          --destructive: 0 100% 50%;
          --destructive-foreground: 210 40% 98%;

          --ring: 215 20.2% 65.1%;

          --radius: 0.5rem;
        }

        .dark {
          --background: 224 71% 4%;
          --foreground: 213 31% 91%;

          --muted: 223 47% 11%;
          --muted-foreground: 215.4 16.3% 56.9%;

          --accent: 216 34% 17%;
          --accent-foreground: 210 40% 98%;

          --popover: 224 71% 4%;
          --popover-foreground: 215 20.2% 65.1%;

          --border: 216 34% 17%;
          --input: 216 34% 17%;

          --card: 224 71% 4%;
          --card-foreground: 213 31% 91%;

          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 1.2%;

          --secondary: 222.2 47.4% 11.2%;
          --secondary-foreground: 210 40% 98%;

          --destructive: 0 63% 31%;
          --destructive-foreground: 210 40% 98%;

          --ring: 216 34% 17%;

          --radius: 0.5rem;
        }
      }
    </style>
    <script type="module">
          import defaultTheme from "tailwindcss/defaultTheme"
          import tailwindcssAnimate from "tailwindcss-animate"

          const fontFamily = defaultTheme.fontFamily;

          tailwind.config = {
            darkMode: ["class"],
        content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
        theme: {
          container: {
            center: true,
            padding: "2rem",
            screens: {
              "2xl": "1400px",
            },
          },
          extend: {
            colors: {
              border: "hsl(var(--border))",
              input: "hsl(var(--input))",
              ring: "hsl(var(--ring))",
              background: "hsl(var(--background))",
              foreground: "hsl(var(--foreground))",
              primary: {
                DEFAULT: "hsl(var(--primary))",
                foreground: "hsl(var(--primary-foreground))",
              },
              secondary: {
                DEFAULT: "hsl(var(--secondary))",
                foreground: "hsl(var(--secondary-foreground))",
              },
              destructive: {
                DEFAULT: "hsl(var(--destructive))",
                foreground: "hsl(var(--destructive-foreground))",
              },
              muted: {
                DEFAULT: "hsl(var(--muted))",
                foreground: "hsl(var(--muted-foreground))",
              },
              accent: {
                DEFAULT: "hsl(var(--accent))",
                foreground: "hsl(var(--accent-foreground))",
              },
              popover: {
                DEFAULT: "hsl(var(--popover))",
                foreground: "hsl(var(--popover-foreground))",
              },
              card: {
                DEFAULT: "hsl(var(--card))",
                foreground: "hsl(var(--card-foreground))",
              },
            },
            borderRadius: {
              lg: `var(--radius)`,
              md: `calc(var(--radius) - 2px)`,
              sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
              sans: [...fontFamily.sans],
            },

            keyframes: {
              "accordion-down": {
                from: { height: "0" },
                to: { height: "var(--radix-accordion-content-height)" },
              },
              "accordion-up": {
                from: { height: "var(--radix-accordion-content-height)" },
                to: { height: "0" },
              },
            },
            animation: {
              "accordion-down": "accordion-down 0.2s ease-out",
              "accordion-up": "accordion-up 0.2s ease-out",
            },
          },
        },
        plugins: [tailwindcssAnimate]
      }
    </script>
    <!-- babeljs -->
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
      		  import {createRoot} from "react-dom/client";
            
      		  
import React from 'react';
import { useDualTracking } from './useDualTracking';

const DualTrackingUI = () => {
  const {
    tracking,
    points,
    start,
    stop,
    calibrateHeadingOffset,
    getCurrentStatus,
    waitingForAccuracy,
    currentAccuracy,
    isInitialized,
    requiredAccuracy,
    currentSpeed,
    currentHeading,
    isMoving
  } = useDualTracking();

  const status = getCurrentStatus();

  const handleStartStop = () => {
    if (tracking) {
      stop();
    } else {
      start();
    }
  };

  const handleCalibrate = () => {
    const offset = calibrateHeadingOffset();
    alert(`کالیبراسیون انجام شد: ${offset.toFixed(1)}°`);
  };

  // محاسبه خطای فاصله بین GPS و DR
  const calculateError = () => {
    if (points.length < 2) return 0;
    
    const lastPoint = points[points.length - 1];
    const gps = lastPoint.gps;
    const dr = lastPoint.dr;
    
    // فاصله Haversine
    const R = 6371000;
    const dLat = (dr.latitude - gps.latitude) * Math.PI / 180;
    const dLng = (dr.longitude - gps.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(gps.latitude * Math.PI / 180) * 
              Math.cos(dr.latitude * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const currentError = calculateError();

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Dead Reckoning</h2>
      
      {/* وضعیت اصلی */}
      <div className="mb-6">
        {!tracking && (
          <div className="text-center">
            <button 
              onClick={handleStartStop}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              🚀 شروع ردیابی
            </button>
          </div>
        )}

        {tracking && waitingForAccuracy && (
          <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-800 font-semibold mb-2">
              ⏳ انتظار دقت GPS...
            </div>
            <div className="text-sm text-yellow-600">
              دقت فعلی: <span className="font-mono">{currentAccuracy.toFixed(1)}m</span>
            </div>
            <div className="text-sm text-yellow-600">
              نیاز به: <span className="font-mono">{requiredAccuracy}m</span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min((requiredAccuracy / Math.max(currentAccuracy, requiredAccuracy)) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {tracking && isInitialized && (
          <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-800 font-semibold mb-2">
              ✅ ردیابی فعال
            </div>
            <button 
              onClick={handleStartStop}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
            >
              🛑 توقف
            </button>
          </div>
        )}
      </div>

      {/* اطلاعات لحظه‌ای */}
      {isInitialized && (
        <div className="space-y-4">
          {/* وضعیت حرکت */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">وضعیت حرکت</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">حالت:</span>
                <span className={`ml-2 font-semibold ${isMoving ? 'text-green-600' : 'text-gray-600'}`}>
                  {isMoving ? '🏃 در حرکت' : '⏸️ ثابت'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">سرعت:</span>
                <span className="ml-2 font-mono">
                  {status.speedKmh} km/h
                </span>
              </div>
              <div>
                <span className="text-gray-600">جهت:</span>
                <span className="ml-2 font-mono">
                  {currentHeading.toFixed(0)}°
                </span>
              </div>
              <div>
                <span className="text-gray-600">دقت GPS:</span>
                <span className="ml-2 font-mono">
                  {currentAccuracy.toFixed(1)}m
                </span>
              </div>
            </div>
          </div>

          {/* خطای ردیابی */}
          {points.length > 1 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">دقت ردیابی</h3>
              <div className="text-sm">
                <div>
                  <span className="text-gray-600">فاصله خطا:</span>
                  <span className={`ml-2 font-mono font-semibold ${
                    currentError < 5 ? 'text-green-600' : 
                    currentError < 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {currentError.toFixed(1)}m
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-gray-600">تعداد نقاط:</span>
                  <span className="ml-2 font-mono">{points.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* تاریخچه حرکت */}
          {status.movementHistory.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">تاریخچه تشخیص</h3>
              <div className="flex items-center space-x-1">
                {status.movementHistory.map((moving, index) => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full ${
                      moving ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={moving ? 'در حرکت' : 'ثابت'}
                  ></div>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({status.movementHistory.filter(Boolean).length}/5)
                </span>
              </div>
            </div>
          )}

          {/* دکمه کالیبراسیون */}
          <div className="text-center">
            <button
              onClick={handleCalibrate}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
            >
              🧭 کالیبراسیون قطب‌نما
            </button>
          </div>

          {/* نمایش آخرین نقطه */}
          {points.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">موقعیت فعلی</h3>
              <div className="text-xs font-mono space-y-1">
                <div>
                  <span className="text-blue-600">GPS:</span>
                  <span className="ml-2">
                    {points[points.length - 1].gps.latitude.toFixed(6)}, 
                    {points[points.length - 1].gps.longitude.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-red-600">DR:</span>
                  <span className="ml-2">
                    {points[points.length - 1].dr.latitude.toFixed(6)}, 
                    {points[points.length - 1].dr.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* وضعیت دیباگ */}
      {process.env.NODE_ENV === 'development' && points.length > 0 && (
        <div className="mt-6 bg-gray-100 p-3 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">🔍 اطلاعات دیباگ</summary>
            <pre className="mt-2 overflow-x-auto">
              {JSON.stringify(points[points.length - 1].dr, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};


      		  createRoot(document.getElementById("root")).render(
             <>
      		    <DualTrackingUI />
              </>
      		    );
              window.parent.postMessage({ action: "ready" }, "*");
    </script>
  </body>
</html>