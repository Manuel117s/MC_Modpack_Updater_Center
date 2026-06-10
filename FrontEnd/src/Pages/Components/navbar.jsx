import React, { useState } from 'react';

function navBar(){
    const styles = {
        navbar: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontFamily: 'sans-serif',
        },
        homeLink: {
            textDecoration: 'none',
            color: '#1a1a1a',
            fontWeight: 'bold',
            fontSize: '1.25rem',
        },
        navRight: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        btn: {
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none',
        },
        btnLogin: {
            backgroundColor: 'transparent',
            color: '#4a4a4a',
        },
        btnPrimary: {
            backgroundColor: '#2563eb',
            color: 'white',
        }
    }
    
    const [isLoginHovered, setIsLoginHovered] = useState(false);

    return(
    <nav style={styles.navbar}>
        <div style={styles.navLeft}>
            <a href="/" style={styles.homeLink}>CurseModpack</a>
        </div>

        <div style={styles.navRight}>
            <button 
            style={{ 
                ...styles.btn, 
                ...styles.btnLogin, 
                color: isLoginHovered ? '#000000' : '#4a4a4a' 
            }}
            onMouseEnter={() => setIsLoginHovered(true)}
            onMouseLeave={() => setIsLoginHovered(false)}
            >
            Log In
            </button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }}>
            Get Started
            </button>
        </div>
    </nav>
    )
}

export default navBar