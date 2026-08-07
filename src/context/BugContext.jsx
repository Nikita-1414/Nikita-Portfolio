import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const BugContext = createContext(null);

export const useBugs = () => {
    const ctx = useContext(BugContext);
    if (!ctx) throw new Error('useBugs must be used within a BugProvider');
    return ctx;
};

export const BugProvider = ({ children }) => {
    const [fixedBugs, setFixedBugs] = useState([]);

    const fixBug = useCallback((bugId) => {
        setFixedBugs(prev => prev.includes(bugId) ? prev : [...prev, bugId]);
    }, []);

    const value = useMemo(() => ({
        fixedBugs,
        fixedCount: fixedBugs.length,
        totalBugs: 5,
        fixBug,
        allFixed: fixedBugs.length >= 5,
    }), [fixedBugs, fixBug]);

    return (
        <BugContext.Provider value={value}>
            {children}
        </BugContext.Provider>
    );
};

export default BugContext;
