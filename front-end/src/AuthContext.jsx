import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use wallet address from MetaMask as the user identity
    const syncWallet = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts[0]) setUser({ id: accounts[0], address: accounts[0] });
        window.ethereum.on('accountsChanged', (accs) => {
          setUser(accs[0] ? { id: accs[0], address: accs[0] } : null);
        });
      }
    };
    syncWallet();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using authentication context
export const useAuth = () => {
  return useContext(AuthContext);
};
