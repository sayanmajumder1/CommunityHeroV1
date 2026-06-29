import React, { useState, useEffect, useRef } from 'react';
import { useStore, getAuthToken } from '../../store';
import { Link } from 'react-router';
import { 
  ShieldAlert, FileText, CheckCircle, TrendingUp, Sparkles, 
  MapPin, Plus, Trophy, Award, ChevronRight, ChevronLeft, Compass, Calendar,
  Play, Pause, ArrowRight, Activity, Shield, Sparkle, Camera, MessageSquare, Map, Check, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import IssueLiveTracker from '../../components/IssueLiveTracker';
import CommunityIssuesFeed from '../components/CommunityIssuesFeed';

export default function CitizenHome() {
  const issues = useStore((state) => state.issues);
  const user = useStore((state) => state.user);
  const fetchIssues = useStore((state) => state.fetchIssues);
  const setUser = useStore((state) => state.setUser);
  const [selectedTrackingId, setSelectedTrackingId] = useState<string | null>(null);

  // Sync user profile and issues on mount
  useEffect(() => {
    fetchIssues();

    const syncUserProfile = async () => {
      if (!user?.uid) return;
      try {
        const token = await getAuthToken();
        if (!token) return;
        const res = await fetch(`/api/users/${user.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const profileData = await res.json();
          setUser({ ...user, ...profileData });
        }
      } catch (e) {
        console.error('Error syncing user profile on mount:', e);
      }
    };

    syncUserProfile();
  }, [fetchIssues, user?.uid, setUser]);

  // Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  interface CarouselSlide {
    title: string;
    description: string;
    image: string;
    link: string;
    buttonText: string;
    color: string;
    tag?: string;
  }

  const carouselSlides: CarouselSlide[] = [
    {
      title: 'Report Civic Issues',
      description: 'Instantly file potholes, broken streetlights, or waste pile-ups directly to municipal dispatch.',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/report',
      buttonText: 'Report Now',
      color: 'from-emerald-500 to-green-600'
    },
    {
      title: 'AI-Powered Detection',
      description: 'Upload photos of concerns; our advanced vision AI automatically classifies category, severity, and location details.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/report',
      buttonText: 'Try AI Scan',
      color: 'from-emerald-600 to-teal-600'
    },
    {
      title: 'Live Issue Tracking',
      description: 'Watch public works crews move on the live map as they head out to resolve your reported issues.',
      image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/reports',
      buttonText: 'Track Progress',
      color: 'from-green-600 to-teal-700'
    },
    {
      title: 'Community Verification',
      description: 'Upvote and verify nearby reports to accelerate response times and help public departments prioritize.',
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/community',
      buttonText: 'Verify Issues',
      color: 'from-emerald-500 to-emerald-700'
    },
    {
      title: 'Interactive City Map',
      description: 'Visualize all current incidents, active crews, and resolved repairs across our municipality.',
      image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/map',
      buttonText: 'Open Live Map',
      color: 'from-teal-600 to-green-600'
    },
    {
      title: 'Rewards & Badges',
      description: 'Earn civic reputation points (XP) for reporting and verifying issues, then redeem them for local community rewards.',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/rewards',
      buttonText: 'Claim Rewards',
      color: 'from-emerald-600 to-lime-600'
    },
    {
      title: 'Emergency Reporting',
      description: 'Access fast-track priority channels for hazardous roadblocks, fallen trees, or broken powerlines.',
      image: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/report',
      buttonText: 'Emergency Report',
      color: 'from-red-600 to-emerald-600'
    },
    {
      title: 'Smart Neighborhood Analytics',
      description: 'Understand local civic trends, dispatch latency, and resolution rates in our community dashboard.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      link: '/citizen/community',
      buttonText: 'View Insights',
      color: 'from-emerald-700 to-teal-800'
    }
  ];

  // Autoplay Effect for Carousel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, carouselSlides.length]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    touchStartX.current = null;
  };

  if (!user) return null;

  // Statistics calculation
  const stats = [
    { 
      name: 'Reports Logged', 
      value: issues.filter(i => i.reporterId === user.uid).length, 
      icon: FileText, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100/50',
      desc: 'Your filed incidents',
      link: '/citizen/reports'
    },
    { 
      name: 'Resolved Issues', 
      value: issues.filter(i => i.status === 'Resolved').length, 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-green-100/50',
      desc: 'Fixed in your sector',
      link: '/citizen/reports'
    },
    { 
      name: 'Guardian Level', 
      value: `Level ${user.level ?? 1}`, 
      icon: TrendingUp, 
      color: 'text-teal-600', 
      bg: 'bg-teal-50',
      border: 'border-teal-100/50',
      desc: `${user.xp ?? 100} XP accumulated`,
      link: '/citizen/rewards'
    },
    { 
      name: 'Redeemable Points', 
      value: `${user.points ?? 50} Points`, 
      icon: Trophy, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50',
      border: 'border-amber-100/50',
      desc: 'Available for rewards',
      link: '/citizen/rewards'
    }
  ];

  // Quick Action configuration
  const quickActions = [
    {
      title: 'Report Issue',
      desc: 'Log a new concern instantly',
      icon: Plus,
      link: '/citizen/report',
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
      iconColor: 'text-white'
    },
    {
      title: 'Scan with AI',
      desc: 'Vision intelligence analyzer',
      icon: Camera,
      link: '/citizen/report',
      color: 'bg-white border border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'View Map',
      desc: 'Interactive live incident map',
      icon: Map,
      link: '/citizen/map',
      color: 'bg-white border border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Track Reports',
      desc: 'Crew status and logs',
      icon: FileText,
      link: '/citizen/reports',
      color: 'bg-white border border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Community Feed',
      desc: 'Collaborate and verify',
      icon: Compass,
      link: '/citizen/community',
      color: 'bg-white border border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/20',
      iconColor: 'text-emerald-600'
    }
  ];

  // Feature Card configuration
  const featureCards = [
    {
      title: 'Report an Issue',
      description: 'Log potholes, leakages, or outages. Our AI will automatically categorize and dispatch emergency service crews.',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500&q=80',
      link: '/citizen/report',
    
      icon: Plus
    },
    {
      title: 'Interactive Map',
      description: 'Explore active community hazards, ongoing municipal repairs, and tracked public works crews on our city-wide live map.',
      image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=500&q=80',
      link: '/citizen/map',
      
      icon: Map
    },
    {
      title: 'My Reports & Logs',
      description: 'Check status updates for your reports, review active dispatch stages, and chat directly with dispatched repair personnel.',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=500&q=80',
      link: '/citizen/reports',
     
      icon: FileText
    },
    {
      title: 'Community Feed',
      description: 'Collaborate with your neighbors. Upvote, discuss, and physically verify surrounding issues to speed up municipality service priority.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=80',
      link: '/citizen/community',
     
      icon: Compass
    },
    {
      title: 'Rewards & Honors',
      description: 'Earn points and reputation badges for keeping our city safe. Redeem civic XP for local partner rewards and municipal utility credits.',
      image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=500&q=80',
      link: '/citizen/rewards',
      
      icon: Trophy
    },
    {
      title: 'AI Civic Assistant',
      description: 'Get immediate guidance on local regulations, zoning laws, or filing processes using our conversational municipal smart-chatbot.',
      image: '/src/assets/images/regenerated_image_1782562575737.png',
      link: '/citizen/reports',
      
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 text-slate-800" id="citizen-home-mobile-workspace">
      
      {/* Top Welcome Title Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
        <div className="text-left">
          <span className="text-xs font-bold text-emerald-600 tracking-widest uppercase font-mono block mb-1">CITIZEN DASHBOARD</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome to Citizen Portal</h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3.5 py-1.5 rounded-full border border-slate-100 shadow-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </span>
        </div>
      </div>

      {/* Main Grid: Columns layout for Desktop, Stacked layout for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main Feed (8 Spans on Desktop) */}
        <div className="space-y-8 md:col-span-8">
          
          {/* HERO SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-green-800 text-white p-6 sm:p-8 shadow-md shadow-emerald-600/10 border border-emerald-500/10 text-left"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden sm:block opacity-10 pointer-events-none">
              <svg className="w-full h-full object-contain" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 15 L85 45 L85 85 L15 85 L15 45 Z M50 25 L25 47 L25 75 L75 75 L75 47 Z" />
              </svg>
            </div>
          
            <div className="relative z-10 flex flex-col gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] bg-white/10 border border-white/20 font-black tracking-widest uppercase text-white">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>COMMUNITY GUARDIAN</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mt-2">
                  Hi, {user.displayName || 'Neighbor'}!
                </h2>
                <p className="text-sm text-emerald-100 max-w-xl font-medium leading-relaxed">
                  Your local civic contributions keep our municipality safe, clean, and beautiful. Ward 4 incidents get prioritized by automatic dispatch systems. Let's make an impact today.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/citizen/report"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-700 hover:text-emerald-800 font-extrabold text-xs tracking-wider uppercase shadow-sm hover:shadow-md transition duration-200 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                  id="hero-report-btn"
                >
                  <Plus className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                  <span>Report an Issue</span>
                </Link>
                <Link
                  to="/citizen/map"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-white font-extrabold text-xs tracking-wider uppercase hover:bg-emerald-500/30 transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
                  id="hero-view-map-btn"
                >
                  <Map className="w-4 h-4" />
                  <span>View Nearby Issues</span>
                </Link>
              </div>
            </div>
          </motion.div>

<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="text-left">
      <h3 className="text-md font-bold tracking-tight text-slate-900">Featured Platform Services</h3>
      <p className="text-xs text-slate-500 font-medium">Explore standard and automated municipal workflows</p>
    </div>
    
    {/* Carousel controls (unchanged) */}
    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full">
      <button onClick={handlePrevSlide} className="p-1.5 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-white active:scale-95 transition cursor-pointer" aria-label="Previous Slide">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button onClick={() => setIsPaused(!isPaused)} className="p-1.5 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-white active:scale-95 transition cursor-pointer" aria-label={isPaused ? "Play Autoplay" : "Pause Autoplay"}>
        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
      <button onClick={handleNextSlide} className="p-1.5 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-white active:scale-95 transition cursor-pointer" aria-label="Next Slide">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* Carousel Viewport – WITHOUT padding or dots inside */}
  <div 
    className="relative rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm aspect-[4/3] min-[400px]:aspect-[16/10] sm:aspect-[21/9] md:aspect-[16/6] touch-pan-y"
    onMouseEnter={() => setIsPaused(true)}
    onMouseLeave={() => setIsPaused(false)}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
  >
    <AnimatePresence mode="wait">
      <motion.div
        key={activeSlide}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 flex flex-col sm:flex-row"
      >
        {/* Slide Image Left */}
        <div className="w-full sm:w-1/2 h-2/5 sm:h-full relative overflow-hidden">
          <img 
            src={carouselSlides[activeSlide].image} 
            alt={carouselSlides[activeSlide].title}
            className="w-full h-full object-cover filter brightness-[0.95]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Slide Details Right */}
        <div className="w-full sm:w-1/2 p-4 min-[400px]:p-5 sm:p-6 flex flex-col justify-between text-left space-y-2.5 sm:space-y-3">
          <div className="space-y-1 sm:space-y-2">
            {carouselSlides[activeSlide].tag && (
              <span className="text-[8px] min-[400px]:text-[9px] font-black tracking-widest text-emerald-600 font-mono uppercase bg-emerald-50 px-2 py-0.5 min-[400px]:px-2.5 min-[400px]:py-1 rounded-md inline-block">
                {carouselSlides[activeSlide].tag}
              </span>
            )}
            <h4 className="text-sm min-[400px]:text-base sm:text-lg font-black text-slate-950 tracking-tight leading-tight">
              {carouselSlides[activeSlide].title}
            </h4>
            <p className="text-[10.5px] min-[400px]:text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 min-[400px]:line-clamp-3">
              {carouselSlides[activeSlide].description}
            </p>
          </div>

          <Link
            to={carouselSlides[activeSlide].link}
            className="inline-flex items-center justify-center gap-1.5 self-start px-4 py-2 min-[400px]:px-4.5 min-[400px]:py-2 rounded-xl bg-slate-900 text-white font-extrabold text-[10px] min-[400px]:text-[11px] tracking-wider uppercase hover:bg-emerald-600 hover:shadow-md transition duration-200 cursor-pointer min-h-[44px] min-[400px]:min-h-0"
          >
            <span>{carouselSlides[activeSlide].buttonText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>

  {/* 🔥 PROGRESS DOTS – OUTSIDE THE VIEWPORT (no overlap!) */}
  <div className="flex items-center justify-center gap-1.5 pt-3 sm:pt-4">
    {carouselSlides.map((_, idx) => (
      <button
        key={idx}
        onClick={() => setActiveSlide(idx)}
        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
          activeSlide === idx ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
        }`}
        aria-label={`Go to slide ${idx + 1}`}
      />
    ))}
  </div>
</div>

          {/* REAL-TIME DISPATCH TRACKING PANEL */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-left space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  
                  <span>Active Dispatches Tracker</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Monitor active public works crews on site</p>
              </div>
              <Link to="/citizen/reports" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5">
                <span>View My Reports</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {(() => {
              const myActive = issues.filter(i => i.reporterId === user.uid && i.status !== 'Resolved');
              const communityActive = issues.filter(i => i.status !== 'Resolved' && i.reporterId !== user.uid);
              
              if (myActive.length === 0 && communityActive.length === 0) {
                return (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <Compass className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">No Active Dispatches Right Now</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        When you file an issue, our AI assigns priority and dispatches crews. Once dispatched, you can follow progress live.
                      </p>
                    </div>
                    <Link
                      to="/citizen/report"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Incident</span>
                    </Link>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* My Active Dispatches */}
                  {myActive.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono block">My Active Reports</span>
                      <div className="space-y-2.5">
                        {myActive.map((issue) => (
                          <div key={issue.id} className="bg-emerald-50/20 border border-emerald-100/40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div className="min-w-0 flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-emerald-100/50 text-emerald-600 mt-0.5">
                                <Activity className="w-4 h-4 animate-pulse" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                                    {issue.status}
                                  </span>
                                  <span className="text-[9.5px] font-mono text-slate-400">
                                    #{issue.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{issue.title}</h4>
                                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{issue.location.address || 'Central Ward Area'}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTrackingId(issue.id)}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl sm:shrink-0 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Track Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Neighborhood Dispatches */}
                  {communityActive.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                        {myActive.length > 0 ? 'Other Neighborhood Dispatches' : 'Live Neighborhood Dispatches'}
                      </span>
                      <div className="space-y-2.5">
                        {communityActive.slice(0, 2).map((issue) => (
                          <div key={issue.id} className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-slate-200 transition">
                            <div className="min-w-0 flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-slate-50 text-slate-500 mt-0.5">
                                <Shield className="w-4 h-4 animate-pulse" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {issue.status}
                                  </span>
                                  <span className="text-[9.5px] font-mono text-slate-400">
                                    #{issue.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">{issue.title}</h4>
                                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{issue.location.address || 'Central Ward Area'}</span>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTrackingId(issue.id)}
                              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl sm:shrink-0 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm hover:shadow flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Track Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* NEIGHBORHOOD CONCERNS REAL-TIME BACKEND FEED SECTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900">Neighborhood Concerns Feed</h3>
                <p className="text-xs text-slate-500 font-medium">Verify or track recently reported hazards nearby</p>
              </div>
              <Link to="/citizen/reports" className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5">
                <span>See All List</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <CommunityIssuesFeed />
          </div>

          {/* 6 COMPREHENSIVE PLATFORM FEATURE CARDS GRID */}
          <div className="space-y-4 pt-2">
            <div className="text-left">
              <h3 className="text-md font-bold tracking-tight text-slate-900">Explore Platform Modules</h3>
              <p className="text-xs text-slate-500 font-medium">Quickly interact with standard civic and verification workflows</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureCards.map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img 
                        src={card.image} 
                        alt={card.title}
                        className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
                      
                    

                      {/* Header Floating Icon */}
                      <div className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-xl shadow-md">
                        <CardIcon className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                    </div>

                    <div className="p-4.5 flex-1 flex flex-col justify-between text-left space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {card.description}
                        </p>
                      </div>

                      <Link
                        to={card.link}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group/link"
                      >
                        <span>Learn More</span>
                        <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (4 Spans on Desktop) */}
        <div className="space-y-8 md:col-span-4">
          
          {/* STATISTICS SECTION (BENTO KPI CARDS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Your Civic Standing</h3>
             
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {stats.map((item, idx) => (
                <motion.div 
                  key={item.name} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative bg-white rounded-3xl border border-slate-100 p-4 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-300 text-left flex flex-col justify-between aspect-square cursor-pointer overflow-hidden"
                >
                  {/* Subtle decorative background glow on hover */}
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-radial from-emerald-50/10 to-transparent group-hover:from-emerald-100/30 transition duration-300 rounded-full pointer-events-none" />
                  
                  <Link to={item.link} className="flex flex-col justify-between h-full w-full relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`${item.bg} rounded-2xl p-2.5 shrink-0 border ${item.border} group-hover:scale-105 transition-transform duration-300`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all" />
                    </div>
                    
                    <div className="mt-auto space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{item.name}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition">
                          {item.value}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-tight font-medium">
                        {item.desc}
                      </span>
                      
                      {/* Mini visual indicator based on the card type */}
                      {item.name === 'Guardian Level' && (
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((user.xp || 100) % 1000) / 10)}%` }} />
                        </div>
                      )}
                      {item.name === 'Redeemable Points' && (
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (user.points || 0) / 5)}%` }} />
                        </div>
                      )}
                      {item.name === 'Reports Logged' && (
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number(item.value) * 20)}%` }} />
                        </div>
                      )}
                      {item.name === 'Resolved Issues' && (
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Number(item.value) * 25)}%` }} />
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* QUICK ACTIONS SECTION */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
              <span>Quick Civic Actions</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {quickActions.map((action, idx) => {
                const IconComponent = action.icon;
                return (
                  <motion.div
                    key={action.title}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Link
                      to={action.link}
                      className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition duration-200 cursor-pointer ${action.color}`}
                    >
                      <div className={`p-2.5 rounded-xl ${action.iconColor} bg-slate-50 border border-slate-100 group-hover:scale-105 shrink-0`}>
                        <IconComponent className="w-4 h-4 stroke-[2.5px]" />
                      </div>
                      <div className="min-w-0 text-left flex-1">
                        <span className="block text-xs font-extrabold uppercase tracking-wide leading-tight">{action.title}</span>
                        <span className="block text-[10px] opacity-75 font-medium truncate mt-0.5 leading-none">{action.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* QUESTS & REPUTATION CARD */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 shadow-md text-left border border-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none" />
            <div className="absolute top-3 right-3 text-amber-400">
              <Award className="w-5 h-5 animate-bounce" />
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-1">
                <span className="text-[8.5px] font-black tracking-widest text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  WEEKLY QUEST
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-1.5">
                  Neighborhood Sentinel
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  Verify 2 nearby reports filed by fellow citizens to secure Ward 4 and earn bonus +150 XP.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>QUEST PROGRESS</span>
                  <span className="text-emerald-400 font-bold">50% Complete</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-emerald-500 rounded-full shadow-xs shadow-emerald-500/40" />
                </div>
              </div>

              <Link
                to="/citizen/community"
                className="w-full flex items-center justify-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition shadow-sm"
              >
                <span>Browse Local Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* HELP & DOCUMENTATION CARD */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-4.5 h-4.5 text-emerald-600" />
              <span>Guidelines & Help</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Need assistance on how to record high-quality photos or report hazardous emergencies? Reach out to support channels anytime.
            </p>
            <div className="flex justify-between items-center border-t border-slate-50 pt-3">
              <span className="text-[10px] text-slate-400 font-bold">MUNICIPAL DESPATCH DEPT</span>
              <span className="text-[10px] font-bold text-emerald-600 font-mono">24/7 SUPPORT</span>
            </div>
          </div>

        </div>

      </div>

      {/* TRACKING LIVE MODAL COMPONENT */}
      <AnimatePresence>
        {selectedTrackingId && (
          <IssueLiveTracker
            issueId={selectedTrackingId}
            onClose={() => setSelectedTrackingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
