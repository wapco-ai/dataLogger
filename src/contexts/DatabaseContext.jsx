
	      <!DOCTYPE html>
<html>
  <head>
    <title>CodeSandbox</title>

    <script type="importmap">
      {"imports":{"react":"https://esm.sh/react@18.3.1","dexie":"https://esm.sh/dexie?external=react,react-dom","react-dom":"https://esm.sh/react-dom@18.3.1","react/jsx-runtime":"https://esm.sh/react@18.3.1/jsx-runtime","react-dom/client":"https://esm.sh/react-dom@18.3.1/client","tailwindcss/defaultTheme":"https://esm.sh/tailwindcss/defaultTheme","tailwindcss-animate":"https://esm.sh/tailwindcss-animate"}}
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
            
      		  
import React, { createContext, useContext, useState, useEffect } from 'react'
import Dexie from 'dexie'

const DatabaseContext = createContext()

export const useDatabase = () => useContext(DatabaseContext)

export function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null)

  useEffect(() => {
    const database = new Dexie('DataLoggerDB')
    database.version(1).stores({
      nodes: '++id, name, latitude, longitude, notes',
      routes: '++id, nodeIds, distance, estimatedTime'
    })

    setDb(database)
  }, [])

  const addNode = async (nodeData) => {
    return db.nodes.add(nodeData)
  }

  const getAllNodes = async () => {
    return db.nodes.toArray()
  }

  const saveRoute = async (routeData) => {
    return db.routes.add(routeData)
  }

  const value = {
    addNode,
    getAllNodes,
    saveRoute
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

      		  createRoot(document.getElementById("root")).render(
             <>
      		    <useDatabase />
              </>
      		    );
              window.parent.postMessage({ action: "ready" }, "*");
    </script>
  </body>
</html>