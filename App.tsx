import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Button } from './components/Button';
import { askLegalQuestion } from './services/geminiService';
import { saveHistoryItem, getUserHistory, getUserStats } from './services/mockDb';
import { User, View, LegalResponse, HistoryItem } from './types';

// Icons
const ClipboardIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SendIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const HistoryIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Streaming State
  const [targetResponse, setTargetResponse] = useState<LegalResponse | null>(null);
  const [streamedMeaning, setStreamedMeaning] = useState('');
  const [showLists, setShowLists] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ totalQuestions: 0, cacheHitRate: 0, avgResponseTime: '0' });

  // Initial Auth Check
  useEffect(() => {
    const storedUser = localStorage.getItem('asklaw_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load history when entering history view or when Dashboard loads for "Recent Activity"
  useEffect(() => {
    if (user) {
      getUserHistory(user._id).then(setHistory);
      if (view === View.PROFILE) {
        getUserStats(user._id).then(setStats);
      }
    }
  }, [view, user, targetResponse]); // Reload history if a new response is generated

  // Typewriter Effect
  useEffect(() => {
    if (targetResponse) {
      setStreamedMeaning('');
      setShowLists(false);
      let index = 0;
      const fullText = targetResponse.meaning;
      
      // Adjusted speed to 20ms for a better "fetching" feel
      const intervalId = setInterval(() => {
        setStreamedMeaning((prev) => prev + fullText.charAt(index));
        index++;
        if (index >= fullText.length) {
          clearInterval(intervalId);
          setShowLists(true);
        }
      }, 20); 

      return () => clearInterval(intervalId);
    }
  }, [targetResponse]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('asklaw_current_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('asklaw_current_user');
    setView(View.DASHBOARD);
    setTargetResponse(null);
    setQuestion('');
    setHistory([]);
    setStreamedMeaning('');
    setShowLists(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setTargetResponse(null);
    setStreamedMeaning('');
    setShowLists(false);

    try {
      const response = await askLegalQuestion(question);
      setTargetResponse(response);
      
      if (user) {
        await saveHistoryItem(user._id, question, response);
      }
    } catch (error) {
      console.error("Critical Application Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setQuestion(item.question);
    setTargetResponse(item.answer);
    // Instant reveal for history items
    setStreamedMeaning(item.answer.meaning);
    setShowLists(true);
    setView(View.DASHBOARD);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-5xl md:text-7xl font-bold text-white pb-2 drop-shadow-lg tracking-tight">
          Ask<span className="text-amber-400">Law</span>
        </h1>
        <p className="text-xl text-slate-200 max-w-2xl mx-auto font-light font-serif italic border-t border-white/20 pt-4 mt-2">
          "Simplifying the language of law for everyone."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">New Query</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setQuestion('')} className="text-xs h-8 px-2" title="Clear">
                  <TrashIcon />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setQuestion(text);
                    } catch (e) { alert("Clipboard access denied"); }
                  }} 
                  className="text-xs h-8 px-2"
                  title="Paste"
                >
                  <ClipboardIcon />
                </Button>
              </div>
            </div>
            
            <div className="p-6 relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your legal question here... (e.g., 'Is this non-compete clause enforceable?')"
                className="w-full min-h-[140px] p-0 border-0 bg-transparent text-slate-800 placeholder:text-slate-300 focus:ring-0 text-lg resize-none font-medium leading-relaxed"
              />
              <div className="text-right text-xs text-slate-300 font-medium mt-2">
                {question.length} / 2000
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <Button 
                onClick={handleAsk} 
                isLoading={isLoading} 
                className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-serif tracking-wide shadow-lg hover:shadow-amber-600/30 transition-all"
                disabled={!question.trim()}
              >
                {!isLoading && <SendIcon />} <span className="ml-2">Analyze Legal Text</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar / Recent History */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 h-full flex flex-col">
            <h3 className="text-white font-serif font-bold text-xl mb-4 flex items-center gap-2">
              <span className="text-amber-400">⏳</span> Recent Activity
            </h3>
            
            <div className="flex-grow space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
              {!user ? (
                 <div className="text-center py-8">
                   <p className="text-slate-300 text-sm mb-4">Sign in to save your consultations.</p>
                   <Button onClick={() => setIsAuthModalOpen(true)} className="w-full text-xs bg-white/10 hover:bg-white/20 border-white/20">Login</Button>
                 </div>
              ) : history.length === 0 ? (
                <p className="text-slate-400 text-sm italic">No history available yet.</p>
              ) : (
                history.slice(0, 4).map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 transition-all group"
                  >
                    <p className="text-slate-200 text-sm font-medium line-clamp-2 group-hover:text-amber-200 transition-colors">
                      {item.question}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            {user && (
              <div className="pt-4 mt-2 border-t border-white/10">
                <Button 
                  variant="secondary" 
                  onClick={() => setView(View.HISTORY)} 
                  className="w-full bg-amber-500 text-white border-0 hover:bg-amber-600"
                >
                  <HistoryIcon /> <span className="ml-2">View Full History</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-12 text-center border-t-4 border-amber-500 animate-pulse">
          <div className="inline-block mb-4">
             <svg className="animate-spin h-10 w-10 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-serif font-bold text-slate-800">Consulting AskLaw AI...</h3>
          <p className="text-slate-500">Analyzing context and generating insights.</p>
        </div>
      )}

      {targetResponse && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
          <div className="bg-slate-900 px-8 py-5 flex justify-between items-center border-b border-slate-800">
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
              <span className="text-3xl">⚖️</span> 
              <span>Analysis Report</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 bg-green-500 rounded-full ${showLists ? '' : 'animate-ping'}`}></div>
              <span className="text-slate-300 text-xs uppercase tracking-wider font-semibold">
                {showLists ? 'Complete' : 'Generating...'}
              </span>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-10">
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="bg-blue-100 text-blue-700 p-1.5 rounded-md text-xl">📖</span> Explanation
              </h3>
              <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                {streamedMeaning}
                <span className={`${showLists ? 'hidden' : 'inline-block'} w-2 h-5 bg-amber-500 ml-1 animate-pulse align-middle`}></span>
              </p>
            </section>

            {/* Content below fades in after streaming finishes */}
            <div className={`transition-opacity duration-1000 ${showLists ? 'opacity-100' : 'opacity-0'}`}>
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <section className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 p-1.5 rounded-md text-xl">🔄</span> Available Options
                  </h3>
                  <ul className="space-y-3">
                    {targetResponse.options.map((opt, i) => (
                      <li key={i} className="flex gap-3 text-slate-700 animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-amber-50/50 p-6 rounded-xl border border-amber-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 p-1.5 rounded-md text-xl">⚠️</span> Potential Risks
                  </h3>
                  <ul className="space-y-3">
                    {targetResponse.redFlags.map((flag, i) => (
                      <li key={i} className="flex gap-3 text-slate-700 animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="bg-green-100 text-green-700 p-1.5 rounded-md text-xl">➡️</span> Recommended Steps
                </h3>
                <div className="grid gap-3">
                  {targetResponse.nextSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold font-serif">
                        {i + 1}
                      </div>
                      <p className="text-slate-800 font-medium">{step}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600 italic border-l-4 border-slate-300 mt-8">
                <strong>Disclaimer:</strong> This content is generated by AI for educational purposes only. It is not a substitute for professional legal advice from a qualified attorney in your jurisdiction.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Examples */}
      {!targetResponse && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: "📄", title: "Contracts", q: "What is a 'force majeure' clause?" },
            { icon: "💼", title: "Employment", q: "Check this non-compete for red flags." },
            { icon: "🏠", title: "Real Estate", q: "Explain 'easement' in simple terms." },
            { icon: "©️", title: "Copyright", q: "How do I trademark my logo?" },
          ].map((ex, i) => (
            <button 
              key={i}
              onClick={() => setQuestion(ex.q)}
              className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/20 hover:border-amber-400/50 transition-all text-left group"
            >
              <div className="text-2xl mb-2">{ex.icon}</div>
              <h4 className="font-bold text-white mb-1">{ex.title}</h4>
              <p className="text-xs text-slate-300 group-hover:text-white line-clamp-1">{ex.q}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <h2 className="text-4xl font-serif font-bold text-white mb-8 drop-shadow-md border-b border-white/20 pb-4">Consultation History</h2>
      {history.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10">
          <p className="text-slate-400 text-lg mb-4">You haven't asked any questions yet.</p>
          <Button onClick={() => setView(View.DASHBOARD)} className="bg-amber-600 hover:bg-amber-700">Start a Consultation</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleSelectHistoryItem(item)}
              className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 cursor-pointer hover:shadow-2xl hover:border-amber-400 hover:-translate-y-1 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-amber-700 transition-colors">
                  {item.question}
                </h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-600 text-sm line-clamp-2 border-l-2 border-slate-300 pl-3">
                {item.answer.meaning}
              </p>
              <div className="mt-3 flex gap-2">
                {item.answer.redFlags.length > 0 && (
                   <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                     {item.answer.redFlags.length} Risks
                   </span>
                )}
                 <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                   {item.answer.options.length} Options
                 </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <h2 className="text-4xl font-serif font-bold text-white mb-8 drop-shadow-md">User Profile</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
             <h3 className="text-xl font-bold text-white">Account Information</h3>
          </div>
          <div className="p-8 space-y-4">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Username</span>
              <span className="font-bold text-slate-900">{user?.username}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="font-bold text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500 font-medium">Member Since</span>
              <span className="font-bold text-slate-900">{user?.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-500 rounded-2xl shadow-xl border border-amber-600 overflow-hidden text-white">
           <div className="bg-amber-600 px-6 py-4 border-b border-amber-700">
             <h3 className="text-xl font-bold">Insights</h3>
           </div>
           <div className="p-8 space-y-8">
             <div className="text-center">
               <div className="text-5xl font-serif font-extrabold">{stats.totalQuestions}</div>
               <div className="text-xs font-bold uppercase tracking-wider mt-2 opacity-80">Total Queries</div>
             </div>
             <div className="text-center pt-6 border-t border-amber-400/50">
               <div className="text-5xl font-serif font-extrabold">{stats.cacheHitRate}%</div>
               <div className="text-xs font-bold uppercase tracking-wider mt-2 opacity-80">Efficiency Score</div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('https://static.vecteezy.com/system/resources/thumbnails/027/105/966/small_2x/legal-law-and-justice-concept-open-law-book-with-a-wooden-judges-gavel-in-a-courtroom-or-law-enforcement-office-free-photo.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Darker overlay to make image visible but text readable - Navy/Black tint */}
        <div className="absolute inset-0 bg-slate-900/70"></div>
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar 
          user={user} 
          currentView={view} 
          onNavigate={setView} 
          onLogout={handleLogout}
          onLoginClick={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          {view === View.DASHBOARD && renderDashboard()}
          {view === View.HISTORY && renderHistory()}
          {view === View.PROFILE && renderProfile()}
        </main>

        <footer className="mt-auto py-8 text-center text-slate-400 text-sm font-medium border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} AskLaw AI. Empowering justice through technology.</p>
          </div>
        </footer>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(u) => {
          handleLogin(u);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;