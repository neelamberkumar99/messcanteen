import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const canvasRef = useRef(null);

  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      const roleRouteMap = {
        student: "/student/dashboard",
        vendor: "/vendor/dashboard",
        contractor: "/vendor/dashboard",
        admin: "/admin/dashboard",
        superadmin: "/superadmin/dashboard",
      };

      navigate(
        roleRouteMap[user.role?.toLowerCase()] ||
        "/student/dashboard"
      );
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Demo credentials
  const demoCredentials = {
    student: {
      email: "neel@student.com",
      password: "password123",
    },
    vendor: {
      email: "vendor@mess.com",
      password: "password123",
    },
    admin: {
      email: "admin@mess.com",
      password: "password123",
    },
    superadmin: {
      email: "superadmin@mess.com",
      password: "password123",
    },
  };

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let W, H;
    let particles = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init) {
        this.x = Math.random() * W;
        this.y = init ? Math.random() * H : H + 10;

        this.type = Math.random() > 0.75 ? "spark" : "steam";

        if (this.type === "steam") {
          this.vy = -(0.25 + Math.random() * 0.6);
          this.vx = (Math.random() - 0.5) * 0.2;
          this.r = 1.5 + Math.random() * 3;
          this.maxLife = 220 + Math.random() * 280;
        } else {
          this.x = W * 0.1 + Math.random() * W * 0.8;
          this.vy = -(1.2 + Math.random() * 2.2);
          this.vx = (Math.random() - 0.5) * 1.2;
          this.r = 0.6 + Math.random() * 1.4;
          this.maxLife = 50 + Math.random() * 80;
        }

        this.life = init
          ? Math.floor(Math.random() * this.maxLife)
          : 0;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        if (this.type === "steam") {
          this.r += 0.01;
        }

        if (this.life >= this.maxLife || this.y < -20) {
          this.reset(false);
        }
      }

      draw() {
        const alpha = 1 - this.life / this.maxLife;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);

        if (this.type === "steam") {
          ctx.fillStyle = `rgba(255,190,120,${alpha * 0.08})`;
        } else {
          ctx.fillStyle = `rgba(255,220,130,${alpha * 0.8})`;
        }

        ctx.fill();
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, W, H);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Manual login
  const handleManualLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const userData = await login(email, password);

      const roleRouteMap = {
        student: "/student/dashboard",
        vendor: "/vendor/dashboard",
        contractor: "/vendor/dashboard",
        admin: "/admin/dashboard",
        superadmin: "/superadmin/dashboard",
      };

      navigate(
        roleRouteMap[userData?.role?.toLowerCase()] ||
        "/student/dashboard"
      );
    } catch (err) {
      setError(
        err.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // Demo login
  const handleDemoLogin = async (role) => {
    try {
      setLoading(true);

      const creds = demoCredentials[role];

      await login(creds.email, creds.password);

      const routes = {
        student: "/student/dashboard",
        vendor: "/vendor/dashboard",
        admin: "/admin/dashboard",
        superadmin: "/superadmin/dashboard",
      };

      navigate(routes[role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836"
        alt="canteen"
        className="absolute inset-0 h-full w-full object-cover animate-[slowZoom_18s_ease-in-out_infinite_alternate]"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.85)_100%)]" />

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="hidden lg:block"
          >
            <div className="mb-5 inline-block border border-amber-200/20 bg-black/30 px-5 py-2 text-[11px] uppercase tracking-[0.5em] text-amber-200 backdrop-blur-md">
              ▲ Official Dining Hall ▲
            </div>

            <h2 className="mb-3 text-5xl uppercase tracking-[0.4em] text-amber-100">
              Welcome
            </h2>

            <p className="mb-5 text-sm uppercase tracking-[1em] text-amber-300/70">
              · · to the · ·
            </p>

            <h1 className="mb-6 text-7xl font-black uppercase tracking-[0.15em] text-white drop-shadow-[0_0_35px_rgba(255,150,50,0.5)]">
              Mess
              <br />
              Canteen
            </h1>

            <div className="mb-8 flex items-center gap-4">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-amber-300/70" />
              <div className="h-2 w-2 rounded-full bg-amber-300" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-amber-300/70" />
            </div>

            <p className="mb-10 text-xs uppercase tracking-[0.5em] text-amber-100/70">
              Fresh · Hot · Served with Pride
            </p>

            <div className="flex gap-4">
              {["Breakfast", "Lunch", "Dinner"].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-amber-300/20 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-amber-100 backdrop-blur-md"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* LOGIN CARD */}
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-2xl">

              {/* Header */}
              <div className="mb-10 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                  <span className="material-symbols-outlined text-4xl">
                    restaurant
                  </span>
                </div>

                <h2 className="mb-2 text-3xl font-black text-white">
                  Welcome Back
                </h2>

                <p className="text-sm text-slate-300">
                  Login to continue your dashboard
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleManualLogin}
                className="space-y-5"
              >
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-amber-100/70">
                    Email Address
                  </label>

                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition-all focus:border-amber-400 focus:bg-white/15"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.3em] text-amber-100/70">
                    Password
                  </label>

                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition-all focus:border-amber-400 focus:bg-white/15"
                  />
                </div>

                {/* Remember */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input type="checkbox" />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200"
                  >
                    Forgot?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 w-full rounded-2xl bg-amber-500 py-4 text-sm font-black uppercase tracking-[0.3em] text-black transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                >
                  {loading ? "Signing In..." : "Secure Login"}
                </button>
              </form>

              {/* Demo Accounts */}
              <div className="mt-10">
                <div className="mb-5 text-center">
                  <h3 className="text-xs uppercase tracking-[0.4em] text-slate-300">
                    Demo Access
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <RoleButton
                    label="Student"
                    icon="school"
                    onClick={() =>
                      handleDemoLogin("student")
                    }
                  />

                  <RoleButton
                    label="Vendor"
                    icon="storefront"
                    onClick={() =>
                      handleDemoLogin("vendor")
                    }
                  />

                  <RoleButton
                    label="Admin"
                    icon="admin_panel_settings"
                    onClick={() =>
                      handleDemoLogin("admin")
                    }
                  />

                  <RoleButton
                    label="Super"
                    icon="security"
                    onClick={() =>
                      handleDemoLogin("superadmin")
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 z-20 flex h-14 w-full items-center justify-between border-t border-amber-200/10 bg-black/40 px-8 backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-[0.4em] text-amber-100/50">
          Open Daily
        </div>

        <div className="hidden text-[10px] uppercase tracking-[0.3em] text-amber-100/40 md:block">
          Hygienic · Fresh Meals · Quality Food · Community Kitchen
        </div>

        <div className="text-[10px] uppercase tracking-[0.4em] text-amber-100/50">
          Good Food · Good Mood
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1) translateX(0px);
          }
          100% {
            transform: scale(1.12) translateX(-20px);
          }
        }
      `}</style>
    </div>
  );
};

const RoleButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-amber-300/40 hover:bg-white/10"
  >
    <div className="flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-3xl text-amber-300">
        {icon}
      </span>

      <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
        {label}
      </span>
    </div>
  </button>
);

export default Login;