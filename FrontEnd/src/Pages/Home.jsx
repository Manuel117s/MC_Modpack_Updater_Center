import { useState } from 'react';

function SignIn() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Ready to send to FastAPI:', formData);
  };

  // Inline styles matching your Home.jsx structure
  const s = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f3f4f6"
    },
    
    formCard: {
      backgroundColor: "white",
      padding: "2.5rem 2rem",
      borderRadius: "16px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      width: "100%",
      maxWidth: "350px"
    },

    title: {
      textAlign: "center",
      marginTop: "0",
      marginBottom: "1.5rem",
      color: "#1f2937",
      fontFamily: "sans-serif"
    },

    inputGroup: {
      marginBottom: "1.25rem"
    },

    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#4b5563",
      fontSize: "0.875rem",
      fontFamily: "sans-serif",
      fontWeight: "500"
    },

    input: {
      width: "100%",
      padding: "0.75rem",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      fontSize: "1rem",
      boxSizing: "border-box",
    },

    btn: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#2563eb", // Matched the blue from Home.jsx
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "0.5rem"
    }
  };

  return (
    <div style={s.container}>
      <form style={s.formCard} onSubmit={handleSubmit}>
        <h2 style={s.title}>Sign In</h2>
        
        <div style={s.inputGroup}>
          <label htmlFor="name" style={s.label}>Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            style={s.input}
            required 
          />
        </div>

        <div style={s.inputGroup}>
          <label htmlFor="email" style={s.label}>Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            style={s.input}
            required 
          />
        </div>

        <div style={s.inputGroup}>
          <label htmlFor="password" style={s.label}>Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            style={s.input}
            required 
          />
        </div>

        <button type="submit" style={s.btn}>Submit</button>
      </form>
    </div>
  );
}

export default SignIn;