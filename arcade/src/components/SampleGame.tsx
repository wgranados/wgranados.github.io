import { useState, useCallback } from "react";

export default function SampleGame() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("Click the button to start!");

  const handleClick = useCallback(() => {
    const next = count + 1;
    setCount(next);
    if (next < 5) {
      setMessage(`Nice! You've clicked ${next} time${next > 1 ? "s" : ""}.`);
    } else if (next < 10) {
      setMessage(`Getting warmer... ${next} clicks!`);
    } else if (next === 10) {
      setMessage("You win! 🎉 You reached 10 clicks.");
    } else {
      setMessage(`Victory lap: ${next} clicks and counting.`);
    }
  }, [count]);

  const reset = useCallback(() => {
    setCount(0);
    setMessage("Click the button to start!");
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.display}>
        <span style={styles.count}>{count}</span>
      </div>
      <p style={styles.message}>{message}</p>
      <div style={styles.buttons}>
        <button type="button" onClick={handleClick} style={styles.primary}>
          Click me
        </button>
        <button type="button" onClick={reset} style={styles.secondary}>
          Reset
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: "center",
    padding: "2rem 0",
  },
  display: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: "50%",
    border: "3px solid #4a9ae1",
    marginBottom: "1rem",
  },
  count: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#353535",
    fontFamily: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  message: {
    fontSize: "1.1rem",
    color: "#555",
    minHeight: "1.6em",
  },
  buttons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "1rem",
  },
  primary: {
    padding: "0.6rem 1.6rem",
    fontSize: "1rem",
    border: "none",
    borderRadius: 4,
    backgroundColor: "#4a9ae1",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  secondary: {
    padding: "0.6rem 1.6rem",
    fontSize: "1rem",
    border: "1px solid #e5e5e5",
    borderRadius: 4,
    backgroundColor: "#fff",
    color: "#555",
    cursor: "pointer",
    fontFamily: "'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif",
  },
};
