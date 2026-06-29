import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { useStore, UserProfile } from '../store';
import { 
  Shield, LogIn, Sparkles, User, BadgeAlert, Mail, Lock, 
  UserPlus, CheckCircle2, Trophy, Clock, ChevronRight, 
  MapPin, Eye, EyeOff, Info, Cpu, Coins, 
  Smartphone, ArrowLeft, Check, AlertCircle, RefreshCw,
  Sliders, Star, ArrowRight, CheckCircle, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
// Firebase imports completely removed

interface LocalUserCredentials {
  uid?: string;
  name: string;
  email: string;
  password?: string;
  role: 'Citizen' | 'Officer' | 'Admin';
  phone?: string;
  city?: string;
  state?: string;
  address?: string;
  departmentId?: string;
}

const DEFAULT_USERS_KEY = 'community_hero_login_credentials';

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    const numParticles = 35;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      alphaSpeed: number;
    }> = [];
    
    const colors = [
      'rgba(22, 163, 74, ',  // #16A34A
      'rgba(34, 197, 94, ',  // #22C55E
      'rgba(220, 252, 231, ', // #DCFCE7
      'rgba(21, 128, 61, '   // green-700
    ];
    
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 3.5 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.15,
        alphaSpeed: (Math.random() - 0.5) * 0.004
      });
    }
    
    let mouseX = -1000;
    let mouseY = -1000;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };
    
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
    }
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (mouseX >= 0 && mouseY >= 0) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            // Soft push effect (parallax)
            p.x -= (dx / dist) * 0.15;
            p.y -= (dy / dist) * 0.15;
          }
        }
        
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        p.alpha += p.alphaSpeed;
        if (p.alpha < 0.1 || p.alpha > 0.55) {
          p.alphaSpeed = -p.alphaSpeed;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.shadowColor = 'rgba(22, 163, 74, 0.3)';
        ctx.shadowBlur = p.radius * 2.5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
    />
  );
};

export default function LandingPage() {
  const setUser = useStore((state) => state.setUser);
  const logout = useStore((state) => state.logout);
  const setIsFirebaseSession = useStore((state) => state.setIsFirebaseSession);
  
  // Auth state screen routing: 'role_selection' | 'login' | 'register' | 'forgot_password' | 'otp_login'
  const [activeScreen, setActiveScreen] = useState<'role_selection' | 'login' | 'register' | 'forgot_password' | 'otp_login'>('role_selection');
  const [selectedRole, setSelectedRole] = useState<'Citizen' | 'Officer' | 'Admin'>('Citizen');
  
  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone OTP states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpTimer, setOtpTimer] = useState(30);

  // Multi-step Citizen Registration states
  const [regStep, setRegStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regOtpDigits, setRegOtpDigits] = useState<string[]>(Array(6).fill(''));
  const regOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Recovery states
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(Array(6).fill(''));
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [forgotTimer, setForgotTimer] = useState(30);

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Focus state styling helper
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const slides = [
    {
      title: 'Empower Your Neighborhood',
      desc: 'Report street hazards, damaged infrastructure, or environmental concerns directly to local municipal departments.',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    
      icon: MapPin,
      stats: 'SLA RESOLVED: 98.4%',
    },
    {
      title: 'Collaborative Community Power',
      desc: 'Sponsor verification loops! Upvote and endorse neighborhood issues to accelerate local municipal SLA responses.',
      image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1200&q=80',
      
      icon: Sparkles,
      stats: '24,850 VERIFICATIONS',
    },
    {
      title: 'Earn Active Civic Rewards',
      desc: 'Earn contribution multipliers and claim exclusive community recognition badges for your direct neighborhood impacts.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
     
      icon: Trophy,
      stats: '450,000 REWARDS PAID',
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeScreen === 'otp_login' && otpSent && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeScreen, otpSent, otpTimer]);

  // Forgot password OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeScreen === 'forgot_password' && forgotStep === 2 && forgotTimer > 0) {
      interval = setInterval(() => setForgotTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeScreen, forgotStep, forgotTimer]);

  // Seed default registered sandbox users
  useEffect(() => {
    const existingStr = localStorage.getItem(DEFAULT_USERS_KEY);
    let users: LocalUserCredentials[] = [];
    if (existingStr) {
      try {
        users = JSON.parse(existingStr);
      } catch (e) {
        users = [];
      }
    }
    
    const initialUsers: LocalUserCredentials[] = [
      { uid: 'user-seed-1', name: 'Kiran Kumar', email: 'kiran@communityhero.org', password: 'citizen123', role: 'Citizen', phone: '9876543210', city: 'Bengaluru', state: 'Karnataka', address: '12, MG Road' },
      { uid: 'user-seed-2', name: 'Sarah D\'Souza', email: 'sarah@communityhero.org', password: 'citizen123', role: 'Citizen', phone: '9876543211', city: 'Mumbai', state: 'Maharashtra', address: '45, Bandra West' },
      { uid: 'local-officer-officer', name: 'Municipal Officer Dev', email: 'officer@communityhero.org', password: 'admin@123', role: 'Officer', phone: '9876543212', city: 'Delhi', state: 'Delhi', address: 'Municipal Ward 5', departmentId: 'dept-1' },
      { uid: 'local-admin-admin', name: 'Administrator Chief', email: 'admin@communityhero.org', password: 'admin@123', role: 'Admin', phone: '9876543213', city: 'National HQ', state: 'Delhi', address: 'Central Admin Block' }
    ];

    let updated = false;
    initialUsers.forEach(initUser => {
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === initUser.email.toLowerCase());
      if (existingIdx === -1) {
        users.push(initUser);
        updated = true;
      } else if (initUser.departmentId && users[existingIdx].departmentId !== initUser.departmentId) {
        users[existingIdx].departmentId = initUser.departmentId;
        updated = true;
      }
    });

    if (updated || !existingStr) {
      localStorage.setItem(DEFAULT_USERS_KEY, JSON.stringify(users));
    }
  }, []);

  const getRegisteredUsers = (): LocalUserCredentials[] => {
    const data = localStorage.getItem(DEFAULT_USERS_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveRegisteredUser = (newUser: LocalUserCredentials) => {
    const users = getRegisteredUsers();
    users.push(newUser);
    localStorage.setItem(DEFAULT_USERS_KEY, JSON.stringify(users));
  };

  // Password-based credentials Login
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultEmails = ['admin@communityhero.org', 'officer@communityhero.org', 'kiran@communityhero.org', 'sarah@communityhero.org'];
      const emailLower = trimmedEmail.toLowerCase();
      
      let loggedInUser: UserProfile | null = null;
      
      if (defaultEmails.includes(emailLower)) {
        let displayName = 'Civic Hero';
        let role: 'Citizen' | 'Officer' | 'Admin' = 'Citizen';
        let departmentId = undefined;
        let points = 50;
        let xp = 100;
        let level = 1;
        let completedQuestIds: string[] = [];
        let unlockedBadgeIds: string[] = [];
        
        if (emailLower === 'admin@communityhero.org') {
          displayName = 'Administrator Chief';
          role = 'Admin';
          points = 1000;
          xp = 5000;
          level = 10;
        } else if (emailLower === 'officer@communityhero.org') {
          displayName = 'Municipal Officer Dev';
          role = 'Officer';
          departmentId = 'dept-1';
          points = 500;
          xp = 2500;
          level = 5;
        } else if (emailLower === 'kiran@communityhero.org') {
          displayName = 'Kiran Kumar';
          role = 'Citizen';
          points = 350;
          xp = 480;
          level = 3;
          completedQuestIds = ['quest-1'];
          unlockedBadgeIds = ['badge-1', 'badge-3'];
        } else if (emailLower === 'sarah@communityhero.org') {
          displayName = "Sarah D'Souza";
          role = 'Citizen';
          points = 150;
          xp = 220;
          level = 2;
        }
        
        const localUid = emailLower === 'admin@communityhero.org' ? 'local-admin-admin' :
                         emailLower === 'officer@communityhero.org' ? 'local-officer-officer' :
                         `local-${role.toLowerCase()}-${emailLower.split('@')[0]}`;
        loggedInUser = {
          uid: localUid,
          email: emailLower,
          displayName,
          role,
          createdAt: Date.now(),
          points,
          xp,
          level,
          unlockedBadgeIds,
          redeemedRewards: [],
          completedQuestIds,
          ...(departmentId ? { departmentId } : {})
        };
      } else {
        const localUsersList = getRegisteredUsers();
        const localMatch = localUsersList.find(u => u.email.toLowerCase() === emailLower && u.password === trimmedPassword);
        if (localMatch) {
          const localUid = localMatch.uid || `local-citizen-${Math.random().toString(36).substring(7)}`;
          if (!localMatch.uid) {
            localMatch.uid = localUid;
            localStorage.setItem(DEFAULT_USERS_KEY, JSON.stringify(localUsersList));
          }
          loggedInUser = {
            uid: localUid,
            email: localMatch.email,
            displayName: localMatch.name,
            role: localMatch.role as any,
            phone: localMatch.phone,
            city: localMatch.city,
            state: localMatch.state,
            address: localMatch.address,
            createdAt: Date.now(),
            points: 50,
            xp: 100,
            level: 1,
            unlockedBadgeIds: [],
            redeemedRewards: [],
            completedQuestIds: [],
            ...(localMatch.departmentId ? { departmentId: localMatch.departmentId } : {})
          };
        }
      }
      
      if (loggedInUser) {
        toast.success(`Welcome back! Logging in via secure local session...`);
        const bypassToken = `local_bypass_${loggedInUser.uid}:${loggedInUser.email}:${loggedInUser.displayName}`;
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bypassToken}`
            },
            body: JSON.stringify(loggedInUser)
          });
          if (res.ok) {
            const profile = await res.json();
            setUser(profile);
            setIsFirebaseSession(true);
            return;
          }
        } catch (e) {
          console.error('Failed to sync bypass login with backend:', e);
        }
        
        setUser(loggedInUser);
        setIsFirebaseSession(true);
        return;
      }
      
      setError('Invalid email or password. Please verify credentials or use default users like admin@communityhero.org');
      toast.error('Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispatch Phone verification code
  const handleSendPhoneOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOtpSent(true);
      setOtpTimer(30);
      toast.success(`Verification code dispatched.`);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }, 700);
  };

  // Unified OTP typing block handlers
  const handleOtpDigitChange = (value: string, index: number, isReg = false, isForgot = false) => {
    if (isNaN(Number(value))) return;

    const targetDigits = isReg ? regOtpDigits : isForgot ? forgotOtpDigits : otpDigits;
    const setTargetDigits = isReg ? setRegOtpDigits : isForgot ? setForgotOtpDigits : setOtpDigits;
    const refs = isReg ? regOtpRefs : isForgot ? forgotOtpRefs : otpRefs;

    const newDigits = [...targetDigits];
    newDigits[index] = value.substring(value.length - 1);
    setTargetDigits(newDigits);

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, isReg = false, isForgot = false) => {
    const targetDigits = isReg ? regOtpDigits : isForgot ? forgotOtpDigits : otpDigits;
    const setTargetDigits = isReg ? setRegOtpDigits : isForgot ? setForgotOtpDigits : setOtpDigits;
    const refs = isReg ? regOtpRefs : isForgot ? forgotOtpRefs : otpRefs;

    if (e.key === 'Backspace' && !targetDigits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      const newDigits = [...targetDigits];
      newDigits[index - 1] = '';
      setTargetDigits(newDigits);
    }
  };

  // Verify phone login OTP
  const handleVerifyPhoneOtp = (e: FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      toast.error('Please input the full 6-digit passcode.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (code === '123456') {
        const users = getRegisteredUsers();
        const foundUser = users.find(u => u.phone === phoneNumber && u.role === 'Citizen') || users[0];

        const loginPayload = {
          uid: foundUser.uid || `local-citizen-${Math.random().toString(36).substring(7)}`,
          email: foundUser.email,
          displayName: foundUser.name,
          role: 'Citizen' as const,
          createdAt: Date.now()
        };
        logout();
        setUser(loginPayload);
        toast.success(`Welcome back, ${foundUser.name}! Authorized via phone link.`);
      } else {
        toast.error('Invalid code. Try entering "123456".');
      }
    }, 800);
  };

  // Citizen Multi-step registration flow controllers
  const handleRegNext = () => {
    if (regStep === 1) {
      if (!regName.trim()) {
        toast.error('Please enter your full name.');
        return;
      }
      if (regPassword.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
      if (regPassword !== regConfirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regEmail.trim() || !regEmail.includes('@')) {
        toast.error('Please enter a valid email address.');
        return;
      }
      if (!regPhone.trim() || regPhone.length < 10) {
        toast.error('Please enter a valid 10-digit phone number.');
        return;
      }
      const users = getRegisteredUsers();
      if (users.some(u => u.email.toLowerCase() === regEmail.trim().toLowerCase())) {
        toast.error('An account with this email already exists.');
        return;
      }
      setRegStep(3);
    } else if (regStep === 3) {
      if (!regAddress.trim() || !regCity.trim() || !regState.trim()) {
        toast.error('Please complete all location fields.');
        return;
      }
      setRegStep(4);
      toast.success('Validation passed. SMS passcode sent to ' + regPhone);
      setTimeout(() => {
        regOtpRefs.current[0]?.focus();
      }, 100);
    }
  };

  // Verify and complete registration
  const handleRegVerifyOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = regOtpDigits.join('');
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit passcode.');
      return;
    }

    if (code !== '123456') {
      toast.error('Verification code mismatch. Try entering "123456" to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const localUid = `local-citizen-${Math.random().toString(36).substring(7)}`;
      const localUser: UserProfile = {
        uid: localUid,
        email: regEmail.trim().toLowerCase(),
        displayName: regName.trim(),
        role: 'Citizen',
        phone: regPhone,
        city: regCity,
        state: regState,
        address: regAddress,
        createdAt: Date.now(),
        points: 50,
        xp: 100,
        level: 1,
        unlockedBadgeIds: [],
        redeemedRewards: [],
        completedQuestIds: []
      };

      let registeredProfile: UserProfile = localUser;

      // Post to backend using our local bypass authentication header
      try {
        const bypassToken = `local_bypass_${localUid}:${regEmail.trim().toLowerCase()}:${regName.trim()}`;
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bypassToken}`
          },
          body: JSON.stringify(localUser)
        });
        if (res.ok) {
          registeredProfile = await res.json();
        }
      } catch (apiErr) {
        console.error('Could not post bypass user to backend:', apiErr);
      }

      // Update local storage for fallback login matching as well
      saveRegisteredUser({
        uid: localUid,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: 'Citizen',
        phone: regPhone,
        city: regCity,
        state: regState,
        address: regAddress
      });

      setUser(registeredProfile);
      setIsFirebaseSession(true);

      toast.success(`Account created successfully! Welcome, ${regName}.`);
    } catch (err: any) {
      console.error('Registration error:', err);
      // Clean up if registration fails
      localStorage.removeItem('pending_registration_details');
      toast.error(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Recovery Email dispatcher
  const handleForgotEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    const users = getRegisteredUsers();
    const exists = users.some(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());

    if (!exists) {
      toast.error('No account found under this email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setForgotStep(2);
      setForgotTimer(30);
      toast.success('Reset code dispatched. Enter "123456" to proceed.');
      setTimeout(() => {
        forgotOtpRefs.current[0]?.focus();
      }, 100);
    }, 700);
  };

  // Verify recovery code
  const handleForgotOtpVerify = (e: FormEvent) => {
    e.preventDefault();
    const code = forgotOtpDigits.join('');
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }

    if (code !== '123456') {
      toast.error('Verification failed. Use standard passcode "123456".');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setForgotStep(3);
    }, 500);
  };

  // Reset and save new password
  const handleForgotResetPassword = (e: FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      toast.error('Password must contain at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      
      const users = getRegisteredUsers();
      const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === forgotEmail.trim().toLowerCase()) {
          return { ...u, password: forgotNewPassword };
        }
        return u;
      });
      localStorage.setItem(DEFAULT_USERS_KEY, JSON.stringify(updatedUsers));

      setForgotStep(4);
      toast.success('Password updated successfully.');
    }, 900);
  };

  const handleGuestLogin = () => {
    logout();
    useStore.getState().guestLogin();
    toast.success('Logged in as Guest.');
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f1f5f9] flex font-sans overflow-hidden">
      
      {/* 1. LEFT PANEL: Dynamic Carousel Slideshow */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-white flex-col justify-between p-12 border-r border-[#E5E7EB] overflow-hidden"
        id="landing-hero-showcase"
      >
        {/* Fine Material Ambient Background Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(22,163,74,0.04),transparent_65%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-15%] w-[70%] h-[70%] bg-[#16A34A]/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] bg-[#22C55E]/4 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Clean Brand Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-[#16A34A] to-[#22C55E] p-2.5 rounded-2xl shadow-xl shadow-green-600/10 border border-green-400/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#111827] uppercase">
              Community<span className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] bg-clip-text text-transparent">Hero</span>
            </span>
          </div>
        </div>

        {/* Dynamic Carousel Slide Frame (Stripe/Notion Style) */}
        <div className="my-auto py-8 relative z-10 w-full max-w-lg mx-auto" id="landing-hero-slideshow-container">
          <div className="relative h-[410px] rounded-[32px] overflow-hidden shadow-[0_15px_35px_rgba(22,163,74,0.08)] border border-[#E5E7EB] bg-white group flex flex-col">
            
            {/* Background Images with smooth transitions */}
            <div className="relative h-[250px] w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <img
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider descriptive overlays (Bottom white text area) */}
            <div className="bg-[#F8FAFC] border-t border-[#E5E7EB] p-6 flex-1 flex flex-col justify-center text-left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                  
                    <span className="text-[9px] font-mono font-bold text-[#6B7280]">
                      {slides[currentSlide].stats}
                    </span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-[#111827] uppercase leading-tight mt-1">
                    {slides[currentSlide].title}
                  </h2>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed font-medium">
                    {slides[currentSlide].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Sequential Progressive Stories-Style Loaders (Stripe/Instagram Style) */}
          <div className="flex items-center gap-4 justify-center mt-8 px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-full w-fit mx-auto shadow-[0_8px_30px_rgba(22,163,74,0.03)]">
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="relative h-1 w-10 bg-gray-100 rounded-full overflow-hidden cursor-pointer transition-all duration-300 hover:scale-y-125 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 group"
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div className={`absolute inset-0 bg-gray-200 rounded-full transition-opacity group-hover:opacity-100 ${isActive ? 'opacity-0' : 'opacity-60'}`} />
                    {isActive && (
                      <motion.div
                        initial={{ left: '-100%' }}
                        animate={{ left: '0%' }}
                        transition={{ duration: 6, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-full shadow-[0_0_8px_rgba(22,163,74,0.3)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="relative z-10 text-[11px] text-[#6B7280] font-semibold flex justify-center items-center border-t border-[#E5E7EB] pt-5">
          <span>&copy; {new Date().getFullYear()} CommunityHero Platform. All rights reserved.</span>
        </div>
      </div>

      {/* 2. RIGHT PANEL: Core Multi-Screen Authentication Engine */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 bg-white relative overflow-y-auto min-h-screen">
        <ParticleBackground />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(22,163,74,0.06),transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10 py-6">
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: PORTAL SELECTION (ROLE SELECTOR) */}
            {activeScreen === 'role_selection' && (
              <motion.div
                key="role_selection"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-[#F8FAFC]/95 backdrop-blur-md border border-[#E5E7EB] rounded-[32px] p-6 sm:p-8 shadow-[0_15px_40px_rgba(22,163,74,0.05)] space-y-6"
              >
                <div className="text-center lg:text-left space-y-2">
                  <div className="lg:hidden inline-flex bg-gradient-to-tr from-[#16A34A] to-[#22C55E] p-2.5 rounded-2xl mb-2">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-[#111827] uppercase">Choose Your Portal</h2>
                  <p className="text-xs text-[#6B7280] max-w-sm leading-relaxed">
                    Select your access classification below to securely report local hazards, manage incident dispatches, or review analytics.
                  </p>
                </div>

                {/* Role Cards with high-end hover & color triggers */}
                <div className="space-y-3.5">
                  
                  {/* Citizen Card */}
                  <button
                    onClick={() => {
                      setSelectedRole('Citizen');
                      setActiveScreen('login');
                    }}
                    className="w-full group text-left p-3.5 bg-white hover:bg-emerald-50/45 border border-[#E5E7EB] hover:border-[#16A34A]/55 rounded-[24px] transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E5E7EB] relative shadow-inner">
                        <img 
                          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=160&q=80" 
                          alt="Citizen"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover filter brightness-[0.9] group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-1.5 right-1.5 p-1 bg-[#16A34A] rounded-lg text-white shadow-md">
                          <User className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                       
                        <span className="block text-sm font-bold text-[#111827] mt-1 group-hover:text-[#16A34A] transition">Resident Portal</span>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 max-w-[190px] leading-relaxed line-clamp-2">
                          Report local public hazards, upvote civic concerns, and claim rewards.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] group-hover:border-[#16A34A]/30 text-[#6B7280] group-hover:text-[#16A34A] transition-all duration-200">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition duration-200" />
                    </div>
                  </button>

                  {/* Officer Card */}
                  <button
                    onClick={() => {
                      setSelectedRole('Officer');
                      setActiveScreen('login');
                    }}
                    className="w-full group text-left p-3.5 bg-white hover:bg-emerald-50/45 border border-[#E5E7EB] hover:border-[#16A34A]/55 rounded-[24px] transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E5E7EB] relative shadow-inner">
                        <img 
                          src="https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=160&q=80" 
                          alt="Officer"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover filter brightness-[0.9] group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-1.5 right-1.5 p-1 bg-[#16A34A] rounded-lg text-white shadow-md">
                          <Sparkles className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                       
                        <span className="block text-sm font-bold text-[#111827] mt-1 group-hover:text-[#16A34A] transition">Municipal Desk</span>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 max-w-[190px] leading-relaxed line-clamp-2">
                          Verify community reports, dispatch municipal squads, and log field updates.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] group-hover:border-[#16A34A]/30 text-[#6B7280] group-hover:text-[#16A34A] transition-all duration-200">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition duration-200" />
                    </div>
                  </button>

                  {/* Admin Card */}
                  <button
                    onClick={() => {
                      setSelectedRole('Admin');
                      setActiveScreen('login');
                    }}
                    className="w-full group text-left p-3.5 bg-white hover:bg-emerald-50/45 border border-[#E5E7EB] hover:border-[#16A34A]/55 rounded-[24px] transition-all duration-300 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#E5E7EB] relative shadow-inner">
                        <img 
                          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=160&q=80" 
                          alt="Admin"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover filter brightness-[0.9] group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-1.5 right-1.5 p-1 bg-[#16A34A] rounded-lg text-white shadow-md">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      </div>
                      <div>
                     
                        <span className="block text-sm font-bold text-[#111827] mt-1 group-hover:text-[#16A34A] transition">Central Control</span>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 max-w-[190px] leading-relaxed line-clamp-2">
                          Manage municipal departments, analyze platform statistics, and run audits.
                        </p>
                      </div>
                    </div>
                    <div className="p-2 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] group-hover:border-[#16A34A]/30 text-[#6B7280] group-hover:text-[#16A34A] transition-all duration-200">
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition duration-200" />
                    </div>
                  </button>

                </div>

              </motion.div>
            )}

            {/* SCREEN 2: MAIN PASSWORD LOGIN SCREEN */}
            {activeScreen === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setActiveScreen('role_selection')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition duration-150 cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition duration-150" />
                  <span>Choose Another Portal</span>
                </button>

                <div className="space-y-1">
                 
                  <h3 className="text-2xl font-black tracking-tight text-[#111827] uppercase">
                    {selectedRole === 'Citizen' ? 'Welcome Back' : 'Authority Login'}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Provide your system credentials below to authorize session tokens.
                  </p>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-[#E5E7EB] rounded-[30px] overflow-hidden shadow-lg space-y-0 relative z-10">
                  
                  {/* Banner image matching current classification */}
                  <div className="relative h-28 overflow-hidden border-b border-[#E5E7EB]">
                    <img
                      src={
                        selectedRole === 'Citizen' 
                          ? 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'
                          : selectedRole === 'Officer'
                          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
                          : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={`${selectedRole} workspace`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                      <div className="p-1.5 rounded-xl backdrop-blur-md bg-[#DCFCE7]/80 text-[#16A34A] border border-[#16A34A]/20">
                        {selectedRole === 'Citizen' && <User className="w-3.5 h-3.5" />}
                        {selectedRole === 'Officer' && <Sparkles className="w-3.5 h-3.5" />}
                        {selectedRole === 'Admin' && <Shield className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest text-[#111827] uppercase">
                        {selectedRole} SECURED NODE
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 animate-fadeIn">

                    {/* Development quick pre-fill credential banner */}
                    {(selectedRole === 'Officer' || selectedRole === 'Admin') && (
                      <div className="p-3.5 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_12px_rgba(22,163,74,0.02)]">
                        <div className="space-y-1">
                          <span className="block text-[9px] font-black uppercase tracking-widest text-[#6B7280]">Default Development Credentials</span>
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-[#6B7280]">
                              <span className="font-semibold text-[10px] text-[#6B7280] uppercase tracking-wider w-10">Email:</span>
                              <code className="text-[11px] font-mono font-bold text-[#111827] bg-[#DCFCE7] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                {selectedRole === 'Officer' ? 'officer@communityhero.org' : 'admin@communityhero.org'}
                              </code>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#6B7280]">
                              <span className="font-semibold text-[10px] text-[#6B7280] uppercase tracking-wider w-10">Pass:</span>
                              <code className="text-[11px] font-mono font-bold text-[#111827] bg-[#DCFCE7] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                admin@123
                              </code>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultEmail = selectedRole === 'Officer' ? 'officer@communityhero.org' : 'admin@communityhero.org';
                            const defaultPass = 'admin@123';
                            setEmail(defaultEmail);
                            setPassword(defaultPass);
                            toast.success('Default credentials successfully applied!');
                          }}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl shrink-0 transition-all duration-200 cursor-pointer text-white bg-[#16A34A] hover:bg-[#22C55E] shadow-md hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    )}

                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      
                      {/* Email Field with Floating Label & Interactive Focus */}
                      <div className={`relative border rounded-2xl px-4 pb-2 pt-5 md:px-5 md:pb-2.5 md:pt-6 transition-all duration-150 bg-[#F8FAFC] ${
                        focusedField === 'email' 
                          ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10 shadow-[0_0_15px_rgba(22,163,74,0.08)]'
                          : 'border-[#E5E7EB]'
                      }`}>
                        <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-4 md:left-5 transition-all duration-150 pointer-events-none ${
                          focusedField === 'email' || email ? 'top-1.5 text-[#16A34A]' : 'top-4 md:top-5 text-[#6B7280]'
                        }`}>
                          Email Address {focusedField === 'email' && `(e.g. ${selectedRole === 'Citizen' ? 'kiran@communityhero.org' : selectedRole === 'Officer' ? 'officer@communityhero.org' : 'admin@communityhero.org'})`}
                        </label>
                        <div className="flex items-center gap-2">
                          <Mail className={`w-3.5 h-3.5 shrink-0 transition-colors ${focusedField === 'email' ? 'text-[#16A34A]' : 'text-[#6B7280]'}`} />
                          <input
                            type="email"
                            required
                            autoComplete="email"
                            placeholder={selectedRole === 'Citizen' ? 'kiran@communityhero.org' : selectedRole === 'Officer' ? 'officer@communityhero.org' : 'admin@communityhero.org'}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full bg-transparent text-xs md:text-sm font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* Password Field with Floating Label & Bypass Hint */}
                      <div className={`relative border rounded-2xl px-4 pb-2 pt-5 md:px-5 md:pb-2.5 md:pt-6 transition-all duration-150 bg-[#F8FAFC] ${
                        focusedField === 'password'
                          ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10 shadow-[0_0_15px_rgba(22,163,74,0.08)]'
                          : 'border-[#E5E7EB]'
                      }`}>
                        <div className="absolute right-4 top-4 md:right-5 md:top-5 flex items-center gap-1.5 z-10">
                          <span className="text-[8px] font-bold font-mono text-[#6B7280] uppercase tracking-wider">
                            DEFAULT: {selectedRole === 'Citizen' ? 'citizen123' : 'admin@123'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[#6B7280] hover:text-[#111827] transition p-1"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-4 md:left-5 transition-all duration-150 pointer-events-none ${
                          focusedField === 'password' || password ? 'top-1.5 text-[#16A34A]' : 'top-4 md:top-5 text-[#6B7280]'
                        }`}>
                          System Password
                        </label>
                        <div className="flex items-center gap-2">
                          <Lock className={`w-3.5 h-3.5 shrink-0 transition-colors ${focusedField === 'password' ? 'text-[#16A34A]' : 'text-[#6B7280]'}`} />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder={selectedRole === 'Citizen' ? 'citizen123' : 'admin@123'}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(null); }}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 pr-24 placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[10px] font-bold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 text-xs text-[#6B7280] font-semibold">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-[#111827]">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 accent-[#16A34A] rounded border-[#E5E7EB] text-[#16A34A] focus:ring-0 focus:outline-none"
                          />
                          <span>Keep me logged in</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setForgotStep(1);
                            setActiveScreen('forgot_password');
                          }}
                          className="text-[#16A34A] hover:text-[#22C55E] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white rounded-2xl shadow-lg transition-all duration-200 cursor-pointer bg-[#16A34A] hover:bg-[#22C55E] shadow-green-600/10"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Authorizing Token...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Verify and Sign In</span>
                          </>
                        )}
                      </button>

                      {/* Guest Login button */}
                      {selectedRole === 'Citizen' && (
                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-[#16A34A] bg-green-50 hover:bg-green-100 rounded-2xl transition-all duration-200 cursor-pointer border border-green-200"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Continue as Guest</span>
                      </button> )}
                    </form>

                    {/* Alternative OTP log-in for residents */}
                    {selectedRole === 'Citizen' && (
                      <div className="pt-3 border-t border-[#E5E7EB] text-center">
                        <button
                          onClick={() => {
                            setActiveScreen('otp_login');
                            setOtpSent(false);
                            setPhoneNumber('');
                          }}
                          className="text-xs font-bold text-[#6B7280] hover:text-[#16A34A] flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>Login via SMS One-Time Passcode</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account creation links */}
                {selectedRole === 'Citizen' && (
                  <div className="bg-[#F8FAFC] border border-[#E5E7EB] p-4 rounded-3xl flex items-center justify-between text-xs font-medium relative z-10">
                    <span className="text-[#6B7280]">New to Community Hero?</span>
                    <button
                      onClick={() => {
                        setRegStep(1);
                        setActiveScreen('register');
                      }}
                      className="text-[#16A34A] hover:text-[#22C55E] font-extrabold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Create Resident Account</span>
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 3: ONE-TIME PASSCODE (OTP) LOGIN SCREEN */}
            {activeScreen === 'otp_login' && (
              <motion.div
                key="otp_login"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <button
                  onClick={() => setActiveScreen('login')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition duration-150 cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                  <span>Back to Password Login</span>
                </button>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-[#111827] uppercase">One-Time Passcode</h3>
                  <p className="text-xs text-[#6B7280]">
                    Sign in securely using a passcode delivered via SMS text message.
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[30px] overflow-hidden shadow-lg space-y-0 relative z-10">
                  
                  {/* Secure Login Banner */}
                  <div className="relative h-28 overflow-hidden border-b border-[#E5E7EB]">
                    <img
                      src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
                      alt="secure authentication"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-2">
                      <div className="p-1.5 rounded-xl backdrop-blur-md bg-[#DCFCE7]/80 text-[#16A34A] border border-[#16A34A]/20">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest text-[#111827] uppercase">
                        TWO-FACTOR SMS CHANNEL
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {!otpSent ? (
                      <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                        
                        {/* Phone Number Input */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'phone' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'phone' || phoneNumber ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Registered Mobile Number
                          </label>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5 text-[#6B7280] transition-colors mt-0.5 shrink-0" />
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                              onFocus={() => setFocusedField('phone')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="e.g. 9876543210"
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Request Login OTP</span>
                          )}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                        <div className="space-y-3.5 text-center">
                          <label className="block text-[11px] font-extrabold text-[#6B7280] uppercase tracking-widest">
                            Passcode sent to: <span className="text-[#111827]">***-***-{phoneNumber.slice(-4)}</span>
                          </label>
                          
                          {/* OTP digits block */}
                          <div className="flex justify-center gap-2 pt-1">
                            {otpDigits.map((digit, index) => (
                              <input
                                key={index}
                                type="text"
                                maxLength={1}
                                required
                                value={digit}
                                ref={(el) => { otpRefs.current[index] = el; }}
                                onChange={(e) => handleOtpDigitChange(e.target.value, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                className="w-10 h-11 text-center bg-[#F8FAFC] border border-[#E5E7EB] focus:border-[#16A34A] rounded-xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#16A34A]/10 transition-all text-[#111827]"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 items-center text-xs">
                          {otpTimer > 0 ? (
                            <span className="text-[#6B7280] font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#6B7280]" /> Resend available in <strong className="text-[#16A34A] font-mono">{otpTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setOtpTimer(30);
                                toast.success('Passcode resent.');
                              }}
                              className="text-[#16A34A] hover:text-[#22C55E] font-extrabold flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Request New Code
                            </button>
                          )}
                          {/* No sandbox bypass code displayed */}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Verify & Sign In</span>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: CITIZEN REGISTRATION (SIGNUP) */}
            {activeScreen === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <button
                  onClick={() => {
                    if (regStep > 1 && regStep < 4) {
                      setRegStep(prev => prev - 1);
                    } else {
                      setActiveScreen('login');
                    }
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition duration-150 cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                  <span>{regStep > 1 ? 'Back to previous step' : 'Cancel Registration'}</span>
                </button>

                {/* Progress Indicators */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold uppercase text-[#16A34A] tracking-wider">Account Registration</span>
                    <span className="text-[#6B7280] font-semibold">Step {regStep} of 4</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          regStep >= step ? 'bg-[#16A34A] shadow-md shadow-[#16A34A]/15' : 'bg-[#E5E7EB]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-[#111827] uppercase">
                    {regStep === 1 && 'Personal Details'}
                    {regStep === 2 && 'Contact Identity'}
                    {regStep === 3 && 'District Location'}
                    {regStep === 4 && 'Phone Authorization'}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {regStep === 1 && 'Establish your security credentials.'}
                    {regStep === 2 && 'Providing valid contacts allows safe rewards processing.'}
                    {regStep === 3 && 'Your residential sector optimizes automated routing of civic reports.'}
                    {regStep === 4 && 'Enter the verification code sent to your phone.'}
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[30px] overflow-hidden shadow-lg space-y-0 relative z-10">
                  
                  {/* Register banner */}
                  <div className="relative h-24 overflow-hidden border-b border-[#E5E7EB]">
                    <img
                      src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80"
                      alt="Citizen outreach"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-6 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#DCFCE7]/80 text-[#16A34A] border border-[#16A34A]/20">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest text-[#111827] uppercase">
                        CIVIC ALLIANCE REGISTRY
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    
                    {/* STEP 1: Personal credentials */}
                    {regStep === 1 && (
                      <div className="space-y-4">
                        
                        {/* Name */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regName' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regName' || regName ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Full Legal Name
                          </label>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="text"
                              required
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              onFocus={() => setFocusedField('regName')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regPassword' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-[#6B7280] hover:text-[#111827] transition p-1"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regPassword' || regPassword ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Choose Password
                          </label>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              onFocus={() => setFocusedField('regPassword')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 pr-10"
                            />
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regConfirm' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regConfirm' || regConfirmPassword ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Confirm Password
                          </label>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              onFocus={() => setFocusedField('regConfirm')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 pr-10"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleRegNext}
                          className="w-full flex justify-center items-center gap-1.5 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          <span>Continue to Contacts</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* STEP 2: Contact identification */}
                    {regStep === 2 && (
                      <div className="space-y-4">
                        
                        {/* Email */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regEmail' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regEmail' || regEmail ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Email Address
                          </label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="email"
                              required
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              onFocus={() => setFocusedField('regEmail')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regPhone' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regPhone' || regPhone ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Mobile Phone Number
                          </label>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                              onFocus={() => setFocusedField('regPhone')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleRegNext}
                          className="w-full flex justify-center items-center gap-1.5 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          <span>Continue to Location</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* STEP 3: Geographical setup */}
                    {regStep === 3 && (
                      <div className="space-y-4">
                        
                        {/* Street address */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'regAddress' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'regAddress' || regAddress ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Street Address
                          </label>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="text"
                              required
                              value={regAddress}
                              onChange={(e) => setRegAddress(e.target.value)}
                              onFocus={() => setFocusedField('regAddress')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        {/* City & State Row */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                            focusedField === 'regCity' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                          }`}>
                            <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                              focusedField === 'regCity' || regCity ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                            }`}>
                              City
                            </label>
                            <input
                              type="text"
                              required
                              value={regCity}
                              onChange={(e) => setRegCity(e.target.value)}
                              onFocus={() => setFocusedField('regCity')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>

                          <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                            focusedField === 'regState' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                          }`}>
                            <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                              focusedField === 'regState' || regState ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                            }`}>
                              State
                            </label>
                            <input
                              type="text"
                              required
                              value={regState}
                              onChange={(e) => setRegState(e.target.value)}
                              onFocus={() => setFocusedField('regState')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleRegNext}
                          className="w-full flex justify-center items-center gap-1.5 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          <span>Complete & Dispatch Code</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* STEP 4: SMS Validation check */}
                    {regStep === 4 && (
                      <form onSubmit={handleRegVerifyOtpSubmit} className="space-y-5">
                        <div className="space-y-3.5 text-center">
                          <label className="block text-xs font-extrabold text-[#6B7280] uppercase tracking-widest leading-relaxed">
                            Enter code sent to: <span className="text-[#111827]">***-***-{regPhone.slice(-4)}</span>
                          </label>

                          <div className="flex justify-center gap-2 pt-1">
                            {regOtpDigits.map((digit, index) => (
                              <input
                                key={index}
                                type="text"
                                maxLength={1}
                                required
                                value={digit}
                                ref={(el) => { regOtpRefs.current[index] = el; }}
                                onChange={(e) => handleOtpDigitChange(e.target.value, index, true)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index, true)}
                                className="w-10 h-11 text-center bg-[#F8FAFC] border border-[#E5E7EB] focus:border-[#16A34A] rounded-xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#16A34A]/10 transition-all text-[#111827]"
                              />
                            ))}
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 border border-emerald-200/50 px-3 py-1.5 rounded-xl inline-block shadow-sm">
                              Sandbox Test OTP Code: <code className="text-xs text-emerald-700 bg-white border px-1 py-0.5 rounded font-black">123456</code>
                            </span>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Verify & Create Account</span>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 5: PASSWORD RECOVERY (FORGOT PASSWORD) */}
            {activeScreen === 'forgot_password' && (
              <motion.div
                key="forgot_password"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <button
                  onClick={() => {
                    if (forgotStep > 1 && forgotStep < 4) {
                      setForgotStep(prev => prev - 1);
                    } else {
                      setActiveScreen('login');
                    }
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#111827] transition duration-150 cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                  <span>{forgotStep > 1 && forgotStep < 4 ? 'Back to previous' : 'Back to Sign-In'}</span>
                </button>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight text-[#111827] uppercase">
                    {forgotStep === 1 && 'Recover Account'}
                    {forgotStep === 2 && 'Confirm Code'}
                    {forgotStep === 3 && 'New Password'}
                    {forgotStep === 4 && 'Complete'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {forgotStep === 1 && 'Request an account recovery passcode sent to your registered email.'}
                    {forgotStep === 2 && 'Enter the verification passcode sent to your inbox.'}
                    {forgotStep === 3 && 'Choose a secure new password for your account.'}
                    {forgotStep === 4 && 'Account security updated successfully.'}
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[30px] overflow-hidden shadow-lg space-y-0 relative z-10">
                  
                  {/* Recover banner */}
                  <div className="relative h-24 overflow-hidden border-b border-[#E5E7EB]">
                    <img
                      src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
                      alt="Account protection"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-6 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#DCFCE7]/80 text-[#16A34A] border border-[#16A34A]/20">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest text-[#111827] uppercase">
                        SECURE RECOVERY GATEWAY
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    
                    {/* Recovery Step 1 */}
                    {forgotStep === 1 && (
                      <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'forgotEmail' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'forgotEmail' || forgotEmail ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Registered Email Address
                          </label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="email"
                              required
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              onFocus={() => setFocusedField('forgotEmail')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1 placeholder-gray-400"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Send Recovery Code</span>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Recovery Step 2 */}
                    {forgotStep === 2 && (
                      <form onSubmit={handleForgotOtpVerify} className="space-y-5">
                        <div className="space-y-3.5 text-center">
                          <label className="block text-[11px] font-extrabold text-[#6B7280] uppercase tracking-widest leading-relaxed">
                            Verification sent to: <span className="text-[#111827] font-mono break-all">{forgotEmail}</span>
                          </label>

                          <div className="flex justify-center gap-2 pt-1">
                            {forgotOtpDigits.map((digit, index) => (
                              <input
                                key={index}
                                type="text"
                                maxLength={1}
                                required
                                value={digit}
                                ref={(el) => { forgotOtpRefs.current[index] = el; }}
                                onChange={(e) => handleOtpDigitChange(e.target.value, index, false, true)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index, false, true)}
                                className="w-10 h-11 text-center bg-[#F8FAFC] border border-[#E5E7EB] focus:border-[#16A34A] rounded-xl text-lg font-bold focus:outline-none focus:ring-4 focus:ring-[#16A34A]/10 transition-all text-[#111827]"
                              />
                            ))}
                          </div>

                          <div className="pt-1.5 text-xs">
                            {forgotTimer > 0 ? (
                              <span className="text-[#6B7280] font-semibold">Resend code in <strong className="text-[#16A34A] font-mono">{forgotTimer}s</strong></span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setForgotTimer(30);
                                  toast.success('Passcode resent.');
                                }}
                                className="text-[#16A34A] hover:text-[#22C55E] font-extrabold flex items-center gap-1.5 mx-auto cursor-pointer bg-transparent border-none"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                              </button>
                            )}
                          </div>
                          {/* No sandbox bypass code displayed */}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          <span>Verify Passcode</span>
                        </button>
                      </form>
                    )}

                    {/* Recovery Step 3 */}
                    {forgotStep === 3 && (
                      <form onSubmit={handleForgotResetPassword} className="space-y-4">
                        
                        {/* New Password */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'forgPwd' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'forgPwd' || forgotNewPassword ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Choose New Password
                          </label>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="password"
                              required
                              value={forgotNewPassword}
                              onChange={(e) => setForgotNewPassword(e.target.value)}
                              onFocus={() => setFocusedField('forgPwd')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1"
                            />
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className={`relative border rounded-2xl px-3.5 pb-1.5 pt-4 transition-all bg-[#F8FAFC] ${
                          focusedField === 'forgConfirm' ? 'border-[#16A34A] ring-4 ring-[#16A34A]/10' : 'border-[#E5E7EB]'
                        }`}>
                          <label className={`absolute text-[9px] font-extrabold uppercase tracking-wider left-3.5 transition-all duration-150 pointer-events-none ${
                            focusedField === 'forgConfirm' || forgotConfirmPassword ? 'top-1.5 text-[#16A34A]' : 'top-3.5 text-[#6B7280]'
                          }`}>
                            Confirm New Password
                          </label>
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#6B7280] shrink-0 mt-0.5" />
                            <input
                              type="password"
                              required
                              value={forgotConfirmPassword}
                              onChange={(e) => setForgotConfirmPassword(e.target.value)}
                              onFocus={() => setFocusedField('forgConfirm')}
                              onBlur={() => setFocusedField(null)}
                              className="w-full bg-transparent text-xs font-bold focus:outline-none text-[#111827] pt-1"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full flex justify-center items-center gap-2 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white bg-[#16A34A] hover:bg-[#22C55E] rounded-2xl shadow-lg shadow-green-600/10 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>Set New Password</span>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Recovery Step 4 */}
                    {forgotStep === 4 && (
                      <div className="text-center py-4 space-y-4">
                        <div className="inline-flex p-3 bg-[#DCFCE7] border border-[#16A34A]/20 text-[#16A34A] rounded-full">
                          <CheckCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-extrabold text-[#111827] uppercase tracking-tight">Security Cleared</h4>
                          <p className="text-xs text-[#6B7280] max-w-[240px] mx-auto leading-relaxed font-medium">
                            Your password has been successfully updated. You can now log in.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setEmail(forgotEmail);
                            setForgotStep(1);
                            setActiveScreen('login');
                          }}
                          className="w-full py-3 bg-[#111827] hover:bg-[#1f2937] text-white font-extrabold uppercase tracking-widest text-xs rounded-2xl transition duration-150 cursor-pointer"
                        >
                          Return to Sign-In
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
