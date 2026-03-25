import React, { useState, useRef, useEffect } from "react";
import { supabase } from './supabaseClient'

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`;

const css = `
${FONTS}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --navy:#2A3520;--navy-mid:#1E2A17;--navy-light:#2E4020;
  --gold:#E8E0D0;--gold-light:#F5F0E8;--gold-pale:#F5F0E8;
  --cream:#FAF6EF;--cream-dark:#F0E8DA;
  --text:#1A1208;--text-mid:#4A3F2F;--text-muted:#8A7B65;
  --white:#fff;--border:rgba(0,0,0,0.09);--border2:rgba(0,0,0,0.14);
  --success:#16A34A;--success-bg:#F0FDF4;--success-border:#BBF7D0;
  --warn:#D97706;--warn-bg:#FFFBEB;--warn-border:#FDE68A;
  --danger:#DC2626;--danger-bg:#FEF2F2;--danger-border:#FECACA;
  --info:#2563EB;--info-bg:#EFF6FF;--info-border:#BFDBFE;
  --abg:#151A12;--abg2:#1A2114;--abg3:#1F2919;--abg4:#26331F;
  --aborder:rgba(255,255,255,0.06);--aborder2:rgba(255,255,255,0.11);
  --atext:rgba(255,255,255,0.92);--atext-mid:rgba(255,255,255,0.55);--atext-muted:rgba(255,255,255,0.28);
  --green:#22C55E;--green-bg:rgba(34,197,94,0.1);--green-border:rgba(34,197,94,0.25);
  --red:#EF4444;--red-bg:rgba(239,68,68,0.1);--red-border:rgba(239,68,68,0.25);
  --amber:#F59E0B;--amber-bg:rgba(245,158,11,0.1);--amber-border:rgba(245,158,11,0.25);
  --blue2:#3B82F6;--blue2-bg:rgba(59,130,246,0.1);--gold-dim:rgba(232,224,208,0.15);--gold-text:#6B5B3E;--gold-border:rgba(232,224,208,0.3);
}
body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--text);font-size:14px;-webkit-font-smoothing:antialiased;}

/* ── TOPNAV ── */
.topnav{background:var(--navy);height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(255,255,255,0.06);backdrop-filter:blur(12px);}
.logo{display:flex;align-items:center;gap:14px;cursor:pointer;text-decoration:none;}
.logo-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;overflow:visible;}
.logo-name{font-family:'Palatino Linotype',Palatino,'Book Antiqua',serif;font-size:17px;color:white;font-weight:700;letter-spacing:0.3px;}
.logo-name span{color:var(--gold-light);}
.nav-tabs{display:flex;gap:2px;background:rgba(255,255,255,0.06);border-radius:7px;padding:3px;}
.nav-tab{padding:5px 12px;border-radius:5px;font-size:11px;font-weight:500;color:rgba(255,255,255,0.4);border:none;background:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;white-space:nowrap;letter-spacing:0.1px;}
.nav-tab.active{background:rgba(245,240,232,0.18);color:white;font-weight:700;}
.nav-right{display:flex;align-items:center;gap:10px;}
.role-btn{padding:4px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:none;color:rgba(255,255,255,0.6);font-size:11px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.role-btn:hover{border-color:var(--gold-light);color:var(--gold-light);}
.nav-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--navy);}

/* ── PAGE SHELL ── */
.page-hd{margin-bottom:28px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--gold-text);margin-bottom:6px;}
.page-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--navy);letter-spacing:-0.3px;}
.page-sub{font-size:14px;color:var(--text-muted);margin-top:3px;font-weight:300;}

/* ── CARDS ── */
.card{background:white;border-radius:12px;border:1px solid rgba(42,53,32,0.09);overflow:hidden;margin-bottom:16px;box-shadow:0 1px 3px rgba(42,53,32,0.04);}
.card-hd{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.card-hd-title{font-size:12px;font-weight:700;color:var(--navy);letter-spacing:0.2px;text-transform:uppercase;}
.card-body{padding:20px;}

/* ── BUTTONS ── */
.btn-primary{padding:9px 20px;background:var(--navy);color:white;border-radius:8px;font-size:12px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;letter-spacing:0.2px;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(42,53,32,0.3);background:#1A2114;}
.btn-primary:disabled{opacity:0.4;cursor:not-allowed;transform:none;box-shadow:none;}
.btn-secondary{padding:8px 17px;background:white;color:var(--text-mid);border-radius:8px;font-size:12px;font-weight:500;border:1.5px solid var(--border);cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;}
.btn-secondary:hover{border-color:var(--navy);color:var(--navy);}
/* Light variants — for use inside navy screen-headers */
.btn-header{padding:7px 16px;background:rgba(232,224,208,0.12);color:var(--gold-light);border-radius:8px;font-size:11px;font-weight:600;border:1px solid rgba(232,224,208,0.2);cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;letter-spacing:0.3px;}
.btn-header:hover{background:rgba(232,224,208,0.2);border-color:rgba(232,224,208,0.35);}
.btn-ghost{padding:6px 13px;background:none;color:var(--text-muted);border-radius:7px;font-size:11px;font-weight:500;border:1px solid var(--border);cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold);}
.btn-back{background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:16px;transition:color 0.2s;}
.btn-back:hover{color:var(--navy);}
/* Back button variant for use inside navy screen-headers */
.btn-back-light{background:none;border:none;color:rgba(255,255,255,0.4);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:14px;transition:color 0.2s;letter-spacing:0.2px;}
.btn-back-light:hover{color:var(--gold-light);}
.btn-cta{padding:9px 20px;background:var(--gold-light);color:var(--navy);border-radius:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:7px;font-family:'DM Sans',sans-serif;}
.btn-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,224,208,0.4);}
.btn-cta:disabled{opacity:0.4;cursor:not-allowed;transform:none;}

/* ── FORM FIELDS ── */
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px;}
.field label{font-size:12px;font-weight:600;color:var(--text-mid);letter-spacing:0.2px;}
.field input,.field select,.field textarea{padding:9px 12px;border-radius:8px;border:1.5px solid var(--border);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);background:white;outline:none;resize:vertical;transition:border-color 0.2s,box-shadow 0.2s;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,224,208,0.1);}
.char-count{font-size:11px;color:var(--text-muted);text-align:right;margin-top:2px;}

/* ── STATUS BADGES ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.3px;}
.badge-green{background:var(--success-bg);color:var(--success);border:1px solid var(--success-border);}
.badge-amber{background:var(--warn-bg);color:var(--warn);border:1px solid var(--warn-border);}
.badge-red{background:var(--danger-bg);color:var(--danger);border:1px solid var(--danger-border);}
.badge-gold{background:var(--gold-pale);color:var(--gold);border:1px solid rgba(232,224,208,0.3);}
.badge-muted{background:rgba(0,0,0,0.05);color:var(--text-muted);border:1px solid var(--border);}
.badge-blue{background:var(--info-bg);color:var(--info);border:1px solid var(--info-border);}

/* ── TOAST ── */
.toast{position:fixed;bottom:20px;right:20px;background:var(--navy);color:white;padding:11px 16px;border-radius:10px;font-size:12px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;animation:slideIn 0.3s ease;}
.toast.toast-error{background:#7F1D1D;border:1px solid rgba(239,68,68,0.3);}
.toast.toast-success{background:#14532D;border:1px solid rgba(34,197,94,0.3);}
@keyframes slideIn{from{transform:translateX(80px);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes slideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(80px);opacity:0;}}

/* ── LANDING ── */
.land-hero{min-height:100vh;background:var(--navy);display:flex;flex-direction:column;position:relative;overflow:hidden;}
.land-hero::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 70% 55% at 12% 22%, rgba(61,80,40,0.7) 0%, transparent 65%),
    radial-gradient(ellipse 85% 70% at 50% 50%, rgba(58,76,37,0.6) 0%, transparent 60%),
    radial-gradient(ellipse 55% 50% at 88% 18%, rgba(51,66,32,0.65) 0%, transparent 60%),
    radial-gradient(ellipse 60% 45% at 78% 80%, rgba(55,72,34,0.55) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 18% 78%, rgba(47,62,29,0.5) 0%, transparent 60%),
    radial-gradient(ellipse 40% 35% at 50% 10%, rgba(50,65,30,0.45) 0%, transparent 55%),
    radial-gradient(ellipse 35% 30% at 50% 92%, rgba(52,68,32,0.5) 0%, transparent 55%);
  filter:blur(28px);
}
.land-nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;position:relative;z-index:2;}
.land-logo{display:flex;align-items:center;gap:10px;}
.land-logo-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;overflow:visible;}
.land-logo-name{font-family:'Palatino Linotype',Palatino,'Book Antiqua',serif;font-size:19px;color:white;font-weight:700;letter-spacing:0.3px;}
.land-logo-name span{color:var(--gold-light);}
.land-nav-links{display:flex;gap:8px;}
.land-nav-btn{padding:8px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.land-nav-login{background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);}
.land-nav-login:hover{border-color:rgba(255,255,255,0.5);color:white;}
.land-nav-signup{background:linear-gradient(135deg,var(--gold),var(--gold-light));border:none;color:var(--navy);font-weight:700;}
.land-hero-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 40px;position:relative;z-index:2;}
.land-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:6px 16px;background:rgba(232,224,208,0.12);border:1px solid rgba(232,224,208,0.25);border-radius:100px;font-size:12px;font-weight:600;color:var(--gold-light);letter-spacing:0.5px;text-transform:uppercase;margin-bottom:24px;}
.land-h1{font-family:'Playfair Display',serif;font-size:clamp(36px,6vw,72px);font-weight:700;color:white;line-height:1.1;letter-spacing:-1px;margin-bottom:20px;}
.land-h1 span{color:var(--gold-light);font-style:italic;}
.land-sub{font-size:18px;color:rgba(255,255,255,0.55);font-weight:300;max-width:560px;line-height:1.6;margin-bottom:36px;}
.land-ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}
.land-cta-primary{padding:16px 32px;background:linear-gradient(135deg,var(--gold),var(--gold-light));border:none;border-radius:12px;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--navy);cursor:pointer;transition:all 0.2s;}
.land-cta-primary:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(232,224,208,0.4);}
.land-cta-secondary{padding:15px 28px;background:none;border:1.5px solid rgba(255,255,255,0.25);border-radius:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.2s;}
.land-cta-secondary:hover{border-color:rgba(255,255,255,0.5);color:white;}
.land-stats{display:flex;gap:48px;margin-top:56px;flex-wrap:wrap;justify-content:center;}
.land-stat-num{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:white;}
.land-stat-label{font-size:13px;color:rgba(255,255,255,0.4);margin-top:2px;}
.land-section{padding:80px 48px;max-width:1100px;margin:0 auto;}
.land-section-eyebrow{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--gold-text);margin-bottom:10px;text-align:center;}
.land-section-title{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:var(--navy);text-align:center;margin-bottom:12px;}
.land-section-sub{font-size:16px;color:var(--text-muted);text-align:center;font-weight:300;max-width:520px;margin:0 auto 48px;}
.land-cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;}
.land-cat-card{background:white;padding:32px 28px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;border:none;}
.land-cat-card::after{content:'';position:absolute;inset:0;background:var(--navy);opacity:0;transition:opacity 0.3s;}
.land-cat-card:hover::after{opacity:1;}
.land-cat-card:hover .cat-label-text{color:white;}
.land-cat-card:hover .cat-count-text{color:rgba(255,255,255,0.5);}
.land-cat-card:hover .cat-arrow{opacity:1;transform:translateX(0);}
.land-cat-card:hover .cat-line{background:var(--gold-light);}
.land-cat-card-inner{position:relative;z-index:1;}
.cat-line{width:24px;height:2px;background:var(--navy);margin-bottom:20px;transition:background 0.3s;}
.cat-label-text{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--navy);margin-bottom:6px;line-height:1.3;transition:color 0.3s;}
.cat-count-text{font-size:11px;color:var(--text-muted);font-weight:500;letter-spacing:0.5px;transition:color 0.3s;}
.cat-arrow{position:absolute;top:32px;right:28px;font-size:18px;color:var(--gold-light);opacity:0;transform:translateX(-8px);transition:all 0.3s;}
.land-hiw{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:0;}
.land-hiw-card{background:white;border-radius:16px;border:1px solid var(--border);padding:28px 24px;}
.land-hiw-num{width:36px;height:36px;border-radius:9px;background:var(--navy);color:var(--gold-light);font-family:'Playfair Display',serif;font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
.land-hiw-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:var(--navy);margin-bottom:8px;}
.land-hiw-sub{font-size:13px;color:var(--text-muted);line-height:1.6;font-weight:300;}
.land-footer{background:var(--navy);padding:40px 48px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.land-footer-copy{font-size:13px;color:rgba(255,255,255,0.35);}

/* ── AUTH ── */
.auth-shell{min-height:100vh;background:var(--cream);display:flex;align-items:center;justify-content:center;padding:40px 20px;}
.auth-box{background:white;border-radius:20px;border:1px solid var(--border);width:100%;max-width:480px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.08);}
.auth-hd{background:var(--navy);padding:28px 32px;}
.auth-hd-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:white;margin-bottom:4px;}
.auth-hd-sub{font-size:13px;color:rgba(255,255,255,0.45);font-weight:300;}
.auth-body{padding:28px 32px;}
.role-select-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
.role-option{border:2px solid var(--border);border-radius:12px;padding:20px 16px;cursor:pointer;transition:all 0.2s;text-align:center;}
.role-option:hover{border-color:var(--gold);background:var(--gold-pale);}
.role-option.sel{border-color:var(--gold);background:var(--gold-pale);}
.role-option-icon{font-size:28px;margin-bottom:8px;}
.role-option-label{font-size:14px;font-weight:700;color:var(--navy);}
.role-option-sub{font-size:11px;color:var(--text-muted);margin-top:3px;}
.auth-switch{text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted);}
.auth-switch button{background:none;border:none;color:var(--gold);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;}
.step-bar{display:flex;align-items:center;gap:0;margin-bottom:24px;}
.step-item{display:flex;align-items:center;flex:1;}
.step-circle{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all 0.3s;border:2px solid var(--cream-dark);color:var(--text-muted);background:white;}
.step-circle.active{background:var(--navy);border-color:var(--navy);color:white;}
.step-circle.done{background:var(--gold);border-color:var(--gold);color:var(--navy);}
.step-label{font-size:10px;font-weight:500;color:var(--text-muted);margin-left:6px;white-space:nowrap;}
.step-label.active{color:var(--navy);font-weight:600;}
.step-line{flex:1;height:2px;background:var(--cream-dark);margin:0 8px;transition:background 0.3s;}
.step-line.done{background:var(--gold);}

/* ══════════════════════════════════════
   UNIFIED DARK INTERIOR DESIGN SYSTEM
   Navy · Cream · Gold — consistent across
   all 5 tabs, matching landing page DNA
══════════════════════════════════════ */

/* Page shell — dark bg for interior */
.page{max-width:1100px;margin:0 auto;width:100%;padding:28px 28px 48px;animation:fadeUp 0.3s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}

/* ── SCREEN HEADER — navy banner ── */
.screen-header{
  background:var(--navy);
  padding:28px 28px 0;
  margin:-28px -28px 28px;
  position:relative;
  overflow:hidden;
}
.screen-header::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 80% 120% at 0% 50%, rgba(61,80,40,0.55) 0%, transparent 60%),
    radial-gradient(ellipse 60% 100% at 100% 0%, rgba(51,66,32,0.4) 0%, transparent 60%);
}
.screen-header.hd-projects::before{background:radial-gradient(ellipse 80% 120% at 0% 50%, rgba(80,55,20,0.5) 0%, transparent 60%),radial-gradient(ellipse 60% 100% at 100% 0%, rgba(61,80,40,0.4) 0%, transparent 60%);}
.screen-header.hd-vendors::before{background:radial-gradient(ellipse 80% 120% at 0% 50%, rgba(15,80,50,0.5) 0%, transparent 60%),radial-gradient(ellipse 60% 100% at 100% 0%, rgba(61,80,40,0.4) 0%, transparent 60%);}
.screen-header.hd-matches::before{background:radial-gradient(ellipse 80% 120% at 0% 50%, rgba(40,40,80,0.5) 0%, transparent 60%),radial-gradient(ellipse 60% 100% at 100% 0%, rgba(61,80,40,0.4) 0%, transparent 60%);}
.screen-header.hd-reviews::before{background:radial-gradient(ellipse 80% 120% at 0% 50%, rgba(80,65,20,0.5) 0%, transparent 60%),radial-gradient(ellipse 60% 100% at 100% 0%, rgba(61,80,40,0.4) 0%, transparent 60%);}
.screen-header-bg{display:none;}
.screen-header-content{position:relative;z-index:1;padding-bottom:0;}
.screen-header-eyebrow{font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(232,224,208,0.45);margin-bottom:6px;}
.screen-header-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:white;letter-spacing:-0.4px;margin-bottom:4px;line-height:1.15;}
.screen-header-sub{font-size:12px;color:rgba(255,255,255,0.38);font-weight:300;line-height:1.6;}
.screen-header-tabs{display:flex;gap:0;margin-top:20px;border-top:1px solid rgba(255,255,255,0.06);}
.screen-header-tab{
  padding:12px 18px;border:none;background:none;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;
  color:rgba(255,255,255,0.3);border-bottom:2px solid transparent;
  transition:all 0.18s;letter-spacing:0.8px;text-transform:uppercase;
}
.screen-header-tab:hover{color:rgba(255,255,255,0.65);}
.screen-header-tab.active{color:var(--gold-light);border-bottom-color:var(--gold-light);}

/* ── FILTER ROW ── */
.board-filters{display:flex;gap:6px;margin:0 0 20px;flex-wrap:wrap;align-items:center;}
.filter-pill{
  padding:6px 15px;border-radius:100px;font-size:11px;font-weight:600;
  border:1px solid rgba(42,53,32,0.18);background:white;
  cursor:pointer;transition:all 0.15s;color:var(--text-muted);
  letter-spacing:0.3px;
}
.filter-pill:hover{border-color:var(--navy);color:var(--navy);background:var(--cream);}
.filter-pill.active{background:var(--navy);border-color:var(--navy);color:var(--gold-light);}
.board-search{position:relative;min-width:220px;flex:1;}
.board-search input{
  width:100%;padding:9px 14px 9px 36px;border-radius:10px;
  border:1px solid rgba(42,53,32,0.15);font-family:'DM Sans',sans-serif;
  font-size:12px;background:white;outline:none;transition:all 0.2s;color:var(--text);
}
.board-search input:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(42,53,32,0.06);}

/* ── PROJECT CARDS ── */
/* ── PROJECT CARDS — redesigned ── */
.project-grid{display:flex;flex-direction:column;gap:10px;}
.project-card{
  cursor:pointer;transition:all 0.2s cubic-bezier(0.34,1.1,0.64,1);
  background:white;border-radius:16px;
  border:1px solid rgba(42,53,32,0.09);
  box-shadow:0 1px 4px rgba(42,53,32,0.05);
  overflow:hidden;position:relative;
}
.project-card:hover{
  transform:translateY(-3px);
  box-shadow:0 12px 36px rgba(42,53,32,0.12);
  border-color:rgba(42,53,32,0.18);
}
.project-card.urgent{border-color:rgba(220,38,38,0.25);box-shadow:0 1px 4px rgba(220,38,38,0.08);}
.project-card.urgent:hover{box-shadow:0 12px 36px rgba(220,38,38,0.14);border-color:rgba(220,38,38,0.4);}
.project-card.hired{border-color:rgba(37,99,235,0.2);}
.project-card-inner{display:flex;align-items:stretch;min-height:0;}
.project-card-left{width:5px;flex-shrink:0;border-radius:16px 0 0 16px;}
.project-card-body{flex:1;padding:18px 20px;min-width:0;}
.project-card-top-row{display:flex;align-items:center;gap:8px;margin-bottom:9px;flex-wrap:wrap;}
.project-cat-badge{
  display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
  border-radius:100px;font-size:9px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;background:var(--cream-dark);color:var(--text-mid);
}
.project-card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--navy);margin-bottom:4px;line-height:1.3;}
.project-card-church{font-size:11px;color:var(--text-muted);margin-bottom:6px;display:flex;align-items:center;gap:5px;}
.project-card-desc{font-size:12px;color:var(--text-mid);line-height:1.65;font-weight:300;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.project-card-meta-row{display:flex;align-items:center;gap:14px;margin-top:12px;flex-wrap:wrap;}
.project-meta-item{font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px;font-weight:500;}
.project-meta-item strong{color:var(--navy);font-weight:700;}
.project-card-right{
  display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;
  padding:18px 20px;flex-shrink:0;min-width:130px;
  border-left:1px solid rgba(42,53,32,0.06);background:rgba(250,246,239,0.4);
  border-radius:0 16px 16px 0;gap:8px;
}
.project-budget{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--navy);text-align:right;}
.project-budget-label{font-size:9px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px;}
.bid-count-badge{
  display:inline-flex;align-items:center;gap:5px;
  padding:4px 10px;border-radius:100px;font-size:10px;font-weight:700;
  background:var(--navy);color:var(--gold-light);letter-spacing:0.3px;
}
.bid-count-badge.has-bids{background:linear-gradient(135deg,var(--navy),#1a3215);}
.bid-dot{width:5px;height:5px;border-radius:50%;background:var(--gold-light);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;}
.sb-open{background:rgba(22,163,74,0.08);color:#16A34A;border:1px solid rgba(22,163,74,0.2);}
.sb-review{background:rgba(217,119,6,0.08);color:#D97706;border:1px solid rgba(217,119,6,0.2);}
.sb-hired{background:rgba(37,99,235,0.08);color:#2563EB;border:1px solid rgba(37,99,235,0.2);}
.sb-urgent{background:rgba(220,38,38,0.08);color:#DC2626;border:1px solid rgba(220,38,38,0.2);}

/* ── VENDOR GRID ── */
.vendor-grid{display:flex;flex-direction:column;gap:0;border:none;border-radius:0;overflow:visible;background:transparent;margin:0;}
.vendor-card{background:white;border-radius:12px;border:1px solid rgba(42,53,32,0.09);overflow:hidden;cursor:pointer;transition:all 0.2s;margin-bottom:8px;box-shadow:0 1px 3px rgba(42,53,32,0.04);}
.vendor-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(42,53,32,0.1);border-color:rgba(232,224,208,0.6);}


.detail-hero{background:var(--navy);border-radius:14px;padding:28px 30px;margin-bottom:16px;position:relative;overflow:hidden;}
.detail-hero-bg{position:absolute;inset:0;opacity:0.07;background-image:linear-gradient(rgba(232,224,208,1) 1px,transparent 1px),linear-gradient(90deg,rgba(232,224,208,1) 1px,transparent 1px);background-size:32px 32px;}
.detail-hero-content{position:relative;z-index:1;}
.detail-cat{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:rgba(232,224,208,0.15);border:1px solid rgba(232,224,208,0.3);border-radius:100px;font-size:11px;font-weight:600;color:var(--gold-light);text-transform:uppercase;margin-bottom:14px;}
.detail-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:white;margin-bottom:10px;line-height:1.2;}
.detail-church{font-size:14px;color:rgba(255,255,255,0.5);margin-bottom:14px;}
.detail-meta-row{display:flex;gap:18px;flex-wrap:wrap;}
.detail-meta-item{font-size:13px;color:rgba(255,255,255,0.6);display:flex;align-items:center;gap:5px;}
.detail-meta-item strong{color:white;}
.detail-section{margin-bottom:22px;}
.detail-section-title{font-size:12px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;padding-bottom:7px;border-bottom:1px solid var(--border);}
.detail-body{font-size:14px;color:var(--text-mid);line-height:1.8;font-weight:300;}
.req-list{list-style:none;display:flex;flex-direction:column;gap:7px;}
.req-item{display:flex;gap:9px;align-items:flex-start;font-size:14px;color:var(--text-mid);}
.req-bullet{width:5px;height:5px;border-radius:50%;background:var(--gold);margin-top:8px;flex-shrink:0;}
.skill-tags{display:flex;flex-wrap:wrap;gap:7px;}
.skill-tag{padding:5px 13px;background:var(--cream-dark);border-radius:100px;font-size:12px;font-weight:500;color:var(--text-mid);}
.bid-panel{background:white;border-radius:14px;border:1px solid var(--border);position:sticky;top:72px;}
.bid-panel-hd{padding:16px 18px;border-bottom:1px solid var(--border);}
.bid-panel-title{font-size:14px;font-weight:700;color:var(--navy);}
.bid-panel-sub{font-size:12px;color:var(--text-muted);margin-top:2px;}
.bid-panel-body{padding:18px;}
.bid-stat-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.bid-stat{text-align:center;padding:11px;background:var(--cream);border-radius:8px;}
.bid-stat-num{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--navy);}
.bid-stat-label{font-size:11px;color:var(--text-muted);margin-top:2px;}
.bid-cta{width:100%;padding:12px;border:none;border-radius:9px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:7px;}
.bid-cta-primary{background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--navy);}
.bid-cta-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(232,224,208,0.3);}
.bid-cta-secondary{background:white;color:var(--text-mid);border:1.5px solid var(--border);margin-top:8px;}
.milestone-row{display:flex;gap:10px;align-items:center;padding:11px 13px;background:var(--cream);border-radius:9px;margin-bottom:8px;}
.milestone-num{width:22px;height:22px;border-radius:50%;background:var(--navy);color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.milestone-input{padding:7px 10px;border-radius:7px;border:1px solid var(--border);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;background:white;width:100%;}
.milestone-input:focus{border-color:var(--gold);}
.bids-table{width:100%;border-collapse:collapse;}
.bids-table th{text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);padding:0 14px 10px;border-bottom:1px solid var(--border);}
.bids-table td{padding:13px 14px;border-bottom:1px solid var(--border);font-size:14px;vertical-align:middle;}
.bids-table tr:last-child td{border-bottom:none;}
.bids-table tr:hover td{background:var(--cream);}
.vendor-mini{display:flex;align-items:center;gap:10px;}
.vendor-mini-avatar{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.vendor-mini-name{font-size:13px;font-weight:600;color:var(--navy);}
.vendor-mini-cat{font-size:11px;color:var(--text-muted);}
.bid-amount-cell{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--navy);}
.badge-best{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:var(--gold);color:var(--navy);border-radius:100px;font-size:9px;font-weight:700;margin-left:5px;}
.btn-accept{padding:6px 14px;background:var(--success);color:white;border-radius:7px;font-size:12px;font-weight:600;border:none;cursor:pointer;}
.btn-accept:hover{background:#15803D;}
.btn-decline-sm{padding:6px 12px;background:white;color:var(--text-muted);border-radius:7px;font-size:12px;font-weight:500;border:1px solid var(--border);cursor:pointer;}
.btn-decline-sm:hover{border-color:var(--danger);color:var(--danger);}
.option-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
.option-card{padding:14px;border-radius:10px;border:1.5px solid var(--border);background:white;cursor:pointer;transition:all 0.2s;text-align:center;}
.option-card:hover,.option-card.selected{border-color:var(--gold);background:var(--gold-pale);}
.option-icon{font-size:22px;margin-bottom:6px;}
.option-label{font-size:12px;font-weight:600;color:var(--navy);}
.option-sub{font-size:11px;color:var(--text-muted);margin-top:2px;}
.tags-wrap{display:flex;flex-wrap:wrap;gap:7px;padding:10px 13px;border-radius:9px;border:1.5px solid var(--border);background:white;min-height:42px;cursor:text;}
.tags-wrap:focus-within{border-color:var(--gold);box-shadow:0 0 0 3px rgba(232,224,208,0.1);}
.tag-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;background:var(--gold-pale);border:1px solid rgba(232,224,208,0.3);border-radius:100px;font-size:12px;font-weight:500;color:var(--text-mid);}
.tag-chip-x{background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:13px;line-height:1;padding:0;}
.tags-input{border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;flex:1;min-width:80px;background:transparent;}

/* ── VENDOR DIRECTORY ── */

.vendor-card-top{height:80px;position:relative;}
.vendor-card-avatar{width:52px;height:52px;border-radius:13px;border:3px solid white;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:22px;position:absolute;bottom:-18px;left:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);}
.vendor-card-body{padding:24px 16px 14px;}
.vendor-card-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--navy);margin-bottom:2px;}
.vendor-card-cat{font-size:12px;color:var(--text-muted);margin-bottom:8px;}
.vendor-card-bio{font-size:11px;color:var(--text-mid);line-height:1.5;font-weight:300;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px;}
.vendor-card-footer{padding:10px 16px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--cream);}
.vendor-rating{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--navy);}
.vendor-rating-stars{color:var(--gold);}
.vendor-location{font-size:11px;color:var(--text-muted);}
.profile-hero{background:var(--navy);border-radius:14px;padding:0;margin-bottom:16px;overflow:hidden;}
.profile-cover{height:120px;background:linear-gradient(135deg,var(--navy-light),var(--navy));position:relative;}
.profile-cover-pattern{position:absolute;inset:0;opacity:0.06;background-image:linear-gradient(rgba(232,224,208,1) 1px,transparent 1px),linear-gradient(90deg,rgba(232,224,208,1) 1px,transparent 1px);background-size:24px 24px;}
.profile-info{padding:0 28px 24px;position:relative;}
.profile-avatar{width:72px;height:72px;border-radius:18px;border:4px solid var(--navy);background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:30px;margin-top:-36px;margin-bottom:12px;}
.profile-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:white;margin-bottom:4px;}
.profile-cat{font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:12px;}
.profile-stats-row{display:flex;gap:20px;flex-wrap:wrap;}
.profile-stat{text-align:center;}
.profile-stat-num{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:white;}
.profile-stat-label{font-size:11px;color:rgba(255,255,255,0.4);}

/* ── MESSAGES — Editorial warm ── */
.msg-root{display:flex;height:calc(100vh - 60px);overflow:hidden;background:var(--cream);}

/* Sidebar / Inbox — navy column matching landing */
.inbox{width:300px;min-width:300px;background:var(--navy);border-right:none;display:flex;flex-direction:column;overflow:hidden;position:relative;}
.inbox::after{content:'';position:absolute;top:0;right:0;width:1px;height:100%;background:rgba(255,255,255,0.06);}
.inbox-head{padding:24px 18px 14px;flex-shrink:0;}
.inbox-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.inbox-title{font-family:'DM Sans',sans-serif;font-size:9px;font-weight:700;color:rgba(232,224,208,0.35);letter-spacing:3px;text-transform:uppercase;}
.inbox-badge{background:var(--gold-light);color:var(--navy);font-size:9px;font-weight:800;padding:2px 9px;border-radius:100px;}
.inbox-search{position:relative;}
.inbox-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.15);}
.inbox-search input{width:100%;padding:9px 12px 9px 32px;border-radius:9px;border:1px solid rgba(255,255,255,0.07);font-family:'DM Sans',sans-serif;font-size:12px;background:rgba(255,255,255,0.04);outline:none;color:rgba(255,255,255,0.7);transition:all 0.2s;}
.inbox-search input::placeholder{color:rgba(255,255,255,0.2);}
.inbox-search input:focus{border-color:rgba(232,224,208,0.18);background:rgba(255,255,255,0.07);}
.inbox-filters{display:flex;gap:4px;padding:8px 14px 10px;flex-shrink:0;}
.inbox-filter{padding:4px 12px;border-radius:100px;font-size:9px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.08);background:none;cursor:pointer;color:rgba(255,255,255,0.28);transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.inbox-filter.active{background:rgba(232,224,208,0.1);border-color:rgba(232,224,208,0.22);color:var(--gold-light);}
.convo-list{flex:1;overflow-y:auto;}
.convo-list::-webkit-scrollbar{width:2px;}
.convo-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);}
.convo-item{display:flex;gap:11px;padding:13px 16px;cursor:pointer;transition:all 0.15s;border-bottom:1px solid rgba(255,255,255,0.04);position:relative;}
.convo-item:hover{background:rgba(255,255,255,0.04);}
.convo-item.active{background:rgba(232,224,208,0.07);}
.convo-item.active::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:2px;background:var(--gold-light);border-radius:0 2px 2px 0;}
.convo-avatar{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;position:relative;letter-spacing:0.5px;}
.convo-avatar.church{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.75);}
.convo-avatar.vendor{background:rgba(232,224,208,0.1);color:var(--gold-light);}
.convo-unread-dot{position:absolute;top:-2px;right:-2px;width:7px;height:7px;border-radius:50%;background:var(--gold-light);border:2px solid var(--navy);}
.convo-body{flex:1;min-width:0;}
.convo-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;}
.convo-name{font-size:12px;font-weight:600;color:rgba(255,255,255,0.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;}
.convo-time{font-size:9px;color:rgba(255,255,255,0.2);flex-shrink:0;font-family:'DM Mono',monospace;}
.convo-project{font-size:10px;color:rgba(232,224,208,0.36);font-weight:500;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.convo-preview{font-size:11px;color:rgba(255,255,255,0.22);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:300;}
.convo-preview.bold{font-weight:600;color:rgba(255,255,255,0.48);}

/* Chat area — cream/white matching interior pages */
.chat-panel{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--cream);}
.chat-head{background:white;padding:0 26px;height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(42,53,32,0.08);flex-shrink:0;box-shadow:0 1px 0 rgba(42,53,32,0.03);}
.chat-head-left{display:flex;align-items:center;gap:13px;}
.chat-head-avatar{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;letter-spacing:0.5px;}
.chat-head-avatar.church{background:var(--navy);color:var(--gold-light);}
.chat-head-avatar.vendor{background:linear-gradient(135deg,var(--navy-light),var(--navy));color:var(--gold-light);}
.chat-head-name{font-size:14px;font-weight:700;color:var(--navy);letter-spacing:-0.2px;}
.chat-head-sub{font-size:11px;color:var(--text-muted);margin-top:1px;}

/* Messages feed */
.chat-messages{flex:1;overflow-y:auto;padding:28px 32px 16px;display:flex;flex-direction:column;gap:2px;background:var(--cream);}
.chat-messages::-webkit-scrollbar{width:3px;}
.chat-messages::-webkit-scrollbar-thumb{background:rgba(42,53,32,0.1);border-radius:2px;}
.msg-group{display:flex;flex-direction:column;margin-bottom:6px;animation:msgIn 0.2s ease;}
@keyframes msgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.msg-group.me{align-items:flex-end;}
.msg-group.them{align-items:flex-start;}
.msg-row{display:flex;align-items:flex-end;gap:8px;margin-bottom:2px;}
.msg-row.me{flex-direction:row-reverse;}
.msg-avatar-sm{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;margin-bottom:2px;letter-spacing:0.3px;}
.msg-avatar-sm.church{background:var(--navy);color:var(--gold-light);}
.msg-avatar-sm.vendor{background:linear-gradient(135deg,var(--navy-light),var(--navy));color:var(--gold-light);}
.msg-avatar-sm.placeholder{visibility:hidden;}
.bubble{max-width:480px;padding:12px 16px;border-radius:18px;font-size:13.5px;line-height:1.65;font-weight:300;word-break:break-word;}
.bubble.me{background:var(--navy);color:rgba(255,255,255,0.92);border-bottom-right-radius:5px;box-shadow:0 3px 12px rgba(42,53,32,0.18);}
.bubble.them{background:white;color:var(--text);border:1px solid rgba(42,53,32,0.08);border-bottom-left-radius:5px;box-shadow:0 1px 4px rgba(42,53,32,0.05);}
.bubble-time{font-size:9px;margin-top:5px;opacity:0.4;font-family:'DM Mono',monospace;letter-spacing:0.3px;}
.typing-indicator{display:flex;align-items:center;gap:7px;padding:6px 0;}
.typing-bubbles{display:flex;gap:4px;background:white;border:1px solid rgba(42,53,32,0.08);padding:11px 15px;border-radius:18px;border-bottom-left-radius:5px;box-shadow:0 1px 4px rgba(42,53,32,0.05);}
.typing-dot{width:5px;height:5px;border-radius:50%;background:var(--text-muted);animation:bounce 1.2s infinite;}
.typing-dot:nth-child(2){animation-delay:0.2s;}
.typing-dot:nth-child(3){animation-delay:0.4s;}
@keyframes bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}
.sys-msg{text-align:center;margin:14px 0;flex-shrink:0;}
.sys-msg-inner{display:inline-flex;align-items:center;gap:6px;padding:4px 14px;background:white;border:1px solid rgba(42,53,32,0.08);border-radius:100px;font-size:10px;color:var(--text-muted);letter-spacing:0.3px;}
.sys-msg-inner.gold{background:var(--gold-pale);border-color:rgba(232,224,208,0.5);color:var(--gold-text);font-weight:600;}
.sys-msg-inner.success{background:rgba(22,163,74,0.06);border-color:rgba(22,163,74,0.2);color:var(--success);font-weight:500;}
.msg-day-divider{display:flex;align-items:center;gap:12px;margin:16px 0;flex-shrink:0;}
.msg-day-line{flex:1;height:1px;background:rgba(42,53,32,0.08);}
.msg-day-label{font-size:9px;color:var(--text-muted);font-weight:700;letter-spacing:1.8px;text-transform:uppercase;font-family:'DM Mono',monospace;}
.file-bubble{display:flex;align-items:center;gap:10px;background:white;border:1px solid rgba(42,53,32,0.1);border-radius:12px;padding:11px 15px;max-width:280px;cursor:pointer;transition:all 0.2s;box-shadow:0 1px 4px rgba(42,53,32,0.05);}
.file-bubble:hover{border-color:var(--navy);box-shadow:0 4px 14px rgba(42,53,32,0.1);}
.file-icon{width:32px;height:32px;border-radius:8px;background:var(--cream-dark);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.file-name{font-size:12px;font-weight:600;color:var(--navy);}
.file-size{font-size:10px;color:var(--text-muted);}

/* Input area */
.chat-input-area{background:white;border-top:1px solid rgba(42,53,32,0.07);padding:14px 24px 18px;flex-shrink:0;}
.quick-reply-row{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.quick-reply{padding:5px 13px;border-radius:100px;border:1px solid rgba(42,53,32,0.1);background:var(--cream);font-size:11px;font-weight:500;color:var(--text-muted);cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.quick-reply:hover{border-color:var(--navy);color:var(--navy);background:white;}
.chat-input-row{display:flex;align-items:flex-end;gap:10px;}
.input-action{width:32px;height:32px;border-radius:8px;border:none;background:none;cursor:pointer;color:var(--text-muted);transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
.input-action:hover{background:var(--cream-dark);color:var(--navy);}
.chat-input{flex:1;padding:11px 16px;border-radius:12px;border:1.5px solid rgba(42,53,32,0.12);font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);background:var(--cream);outline:none;resize:none;transition:all 0.2s;line-height:1.5;}
.chat-input:focus{border-color:var(--navy);background:white;box-shadow:0 0 0 3px rgba(42,53,32,0.05);}
.send-btn{width:42px;height:42px;border-radius:12px;background:var(--navy);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;}
.send-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(42,53,32,0.28);}
.send-btn:disabled{opacity:0.3;cursor:not-allowed;transform:none;}

/* Right detail sidebar */
.ps-sidebar{width:240px;min-width:240px;background:white;border-left:1px solid rgba(42,53,32,0.07);overflow-y:auto;display:flex;flex-direction:column;}
.ps-section{padding:18px 20px;}
.ps-section+.ps-section{border-top:1px solid rgba(42,53,32,0.06);}
.ps-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;opacity:0.7;}
.ps-project-card{background:var(--navy);border-radius:11px;padding:14px;}
.ps-project-title{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:rgba(255,255,255,0.82);margin-bottom:7px;line-height:1.4;}
.ps-meta-item{font-size:10px;color:rgba(255,255,255,0.28);display:flex;align-items:center;gap:4px;margin-bottom:4px;}
.ps-meta-item strong{color:rgba(255,255,255,0.62);}
.ps-milestone{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ps-milestone-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.ps-milestone-dot.done{background:rgba(22,163,74,0.7);}
.ps-milestone-dot.active{background:var(--gold-light);box-shadow:0 0 0 3px rgba(232,224,208,0.18);}
.ps-milestone-dot.todo{background:rgba(255,255,255,0.12);}
.ps-milestone-text{font-size:11px;color:var(--text-mid);}
.ps-milestone-text.done{color:var(--text-muted);text-decoration:line-through;}
.ps-file-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--cream);border:1px solid transparent;cursor:pointer;transition:all 0.2s;margin-bottom:5px;}
.ps-file-item:hover{background:var(--gold-pale);border-color:rgba(232,224,208,0.4);}

/* ── REVIEWS ── */
.review-card{background:white;border-radius:12px;border:1px solid rgba(42,53,32,0.09);padding:18px;margin-bottom:8px;transition:all 0.2s;position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(42,53,32,0.04);}
.review-card:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(42,53,32,0.08);border-color:rgba(42,53,32,0.14);}
.review-card.featured::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,var(--gold),var(--gold-light));}
.review-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:10px;}
.review-avatar{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,var(--navy-light),var(--navy));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.review-author-name{font-size:12px;font-weight:700;color:var(--navy);}
.review-author-meta{font-size:11px;color:var(--text-muted);margin-top:2px;}
.review-stars{font-size:15px;color:var(--gold);}
.review-date{font-size:11px;color:var(--text-muted);}
.review-project-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:var(--cream-dark);border-radius:100px;font-size:11px;font-weight:500;color:var(--text-mid);margin-bottom:9px;}
.review-body{font-size:12px;color:var(--text-mid);line-height:1.75;font-weight:300;font-style:italic;}
.review-body::before{content:'"';}
.review-body::after{content:'"';}
.review-cats{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;}
.review-cat-chip{display:flex;align-items:center;gap:4px;padding:3px 9px;background:var(--cream);border-radius:100px;font-size:10px;color:var(--text-muted);}
.review-reply-box{margin-top:12px;padding:12px;background:var(--cream);border-radius:9px;border-left:3px solid var(--gold);}
.review-reply-label{font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:5px;}
.review-reply-text{font-size:12px;color:var(--text-mid);line-height:1.6;font-weight:300;}
.verified-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:100px;font-size:9px;font-weight:600;color:var(--success);margin-left:5px;}
.star-picker{display:flex;gap:5px;margin-bottom:5px;}
.star-btn{font-size:30px;background:none;border:none;cursor:pointer;transition:transform 0.15s;color:#d1c9b8;line-height:1;}
.star-btn.lit{color:#ca8a04;}
.star-btn:hover{transform:scale(1.2);}
.sub-rating-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
.sub-rating-label{font-size:12px;font-weight:500;color:var(--text-mid);width:150px;flex-shrink:0;}
.sub-stars{display:flex;gap:2px;}
.sub-star{font-size:18px;background:none;border:none;cursor:pointer;color:#d1c9b8;transition:all 0.15s;line-height:1;}
.sub-star.lit{color:#ca8a04;}
.tag-opt{padding:5px 11px;border-radius:100px;border:1.5px solid var(--border);background:white;font-size:11px;font-weight:500;color:var(--text-muted);cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;}
.tag-opt.sel{background:var(--gold-pale);border-color:var(--gold);color:var(--gold);}
.recommend-row{display:flex;gap:10px;}
.recommend-opt{flex:1;padding:12px;border-radius:9px;border:1.5px solid var(--border);background:white;cursor:pointer;transition:all 0.2s;text-align:center;}
.recommend-opt.sel-yes{border-color:var(--success);background:var(--success-bg);}
.recommend-opt.sel-no{border-color:var(--danger);background:var(--danger-bg);}
.pending-card{background:white;border-bottom:1px solid var(--border);padding:16px 20px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:background 0.15s;}
.pending-card:first-of-type{border-radius:14px 14px 0 0;}
.pending-card:last-of-type{border-bottom:none;border-radius:0 0 14px 14px;}
.pending-card:hover{background:var(--cream);}
.pending-card-wrap{border:1px solid rgba(42,53,32,0.09);border-radius:12px;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 3px rgba(42,53,32,0.04);}

/* ── ADMIN ── */
.admin-app{display:flex;height:calc(100vh - 60px);overflow:hidden;}
.admin-sidenav{width:220px;min-width:220px;background:var(--abg2);border-right:1px solid var(--aborder);display:flex;flex-direction:column;overflow:hidden;}
.admin-nav-section{padding:16px 12px 8px;}
.admin-nav-label{font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--atext-muted);padding:0 10px;margin-bottom:6px;opacity:0.6;}
.admin-nav-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;cursor:pointer;transition:all 0.15s;font-size:11.5px;font-weight:500;color:var(--atext-mid);position:relative;margin-bottom:1px;}
.admin-nav-item:hover{background:rgba(255,255,255,0.05);color:var(--atext);}
.admin-nav-item.active{background:rgba(245,240,232,0.08);color:white;font-weight:600;}
.admin-nav-item.active::before{content:'';position:absolute;left:0;top:25%;bottom:25%;width:2.5px;background:var(--gold-light);border-radius:0 2px 2px 0;}
.anav-icon{font-size:14px;width:20px;text-align:center;opacity:0.8;}
.anav-badge{margin-left:auto;padding:2px 6px;border-radius:100px;font-size:9px;font-weight:700;background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);}
.anav-badge.amber{background:var(--amber-bg);color:var(--amber);border-color:var(--amber-border);}
.admin-main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--abg);}
.admin-topbar{background:var(--abg2);height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid var(--aborder);flex-shrink:0;}
.admin-topbar-title{font-size:12px;font-weight:700;color:var(--atext);letter-spacing:0.3px;}
.admin-topbar-right{display:flex;align-items:center;gap:8px;}
.status-pill{display:flex;align-items:center;gap:5px;padding:4px 11px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:100px;font-size:10px;font-weight:600;color:var(--green);}
.pulse{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(1.3);}}
@keyframes skeleton{0%,100%{opacity:1;}50%{opacity:0.5;}}
.admin-btn{padding:4px 11px;border-radius:6px;border:1px solid var(--aborder2);background:none;color:var(--atext-mid);font-size:11px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;}
.admin-btn:hover{border-color:var(--gold);color:var(--gold-light);}
.admin-content{flex:1;overflow-y:auto;padding:24px;}
.admin-content::-webkit-scrollbar{width:4px;}
.admin-content::-webkit-scrollbar-thumb{background:var(--abg4);border-radius:2px;}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
.kpi-card{background:var(--abg2);border:1px solid var(--aborder);border-radius:14px;padding:20px 20px 16px;position:relative;overflow:hidden;transition:all 0.2s;}
.kpi-card:hover{border-color:var(--aborder2);}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
.kpi-card.gold::before{background:linear-gradient(90deg,var(--gold),var(--gold-light));}
.kpi-card.green::before{background:var(--green);}
.kpi-card.blue::before{background:var(--blue2);}
.kpi-card.purple::before{background:#A855F7;}
.kpi-label{font-size:9px;font-weight:700;color:var(--atext-muted);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;opacity:0.7;}
.kpi-val{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--atext);line-height:1;margin-bottom:5px;letter-spacing:-0.3px;}
.kpi-change{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;}
.kpi-change.up{color:var(--green);}
.kpi-change.down{color:var(--red);}
.kpi-sub{font-size:11px;color:var(--atext-muted);margin-top:4px;line-height:1.5;}
.admin-two-col{display:grid;grid-template-columns:1fr 300px;gap:14px;margin-bottom:14px;}
.admin-three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
.panel{background:var(--abg2);border:1px solid var(--aborder);border-radius:14px;overflow:hidden;margin-bottom:16px;transition:border-color 0.2s;}
.panel:hover{border-color:var(--aborder2);}
.panel-hd{padding:14px 18px;border-bottom:1px solid var(--aborder);display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:11px;font-weight:700;color:var(--atext);display:flex;align-items:center;gap:6px;letter-spacing:0.5px;text-transform:uppercase;}
.panel-action{padding:4px 10px;border-radius:6px;border:1px solid var(--aborder2);background:none;color:var(--atext-muted);font-size:10px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;letter-spacing:0.3px;}
.panel-action:hover{color:var(--gold-light);border-color:rgba(245,240,232,0.25);background:rgba(245,240,232,0.05);}
.panel-body{padding:16px 18px;}
.mini-chart{display:flex;align-items:flex-end;gap:3px;height:56px;margin:4px 0;}
.bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
.bar{width:100%;border-radius:2px 2px 0 0;min-height:3px;}
.bar-label{font-size:8px;color:var(--atext-muted);font-family:'DM Mono',monospace;}
.data-table{width:100%;border-collapse:collapse;}
.data-table th{text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--atext-muted);padding:0 0 10px;border-bottom:1px solid var(--aborder);opacity:0.7;}
.data-table td{padding:11px 0;border-bottom:1px solid var(--aborder);font-size:12.5px;vertical-align:middle;}
.data-table tr:last-child td{border-bottom:none;}
.data-table tr:hover td{background:rgba(255,255,255,0.02);}
.feed-item{display:flex;gap:9px;padding:8px 0;border-bottom:1px solid var(--aborder);}
.feed-item:last-child{border-bottom:none;}
.feed-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.feed-text{font-size:10px;color:var(--atext-mid);line-height:1.5;}
.feed-text strong{color:var(--atext);font-weight:600;}
.feed-time{font-size:9px;color:var(--atext-muted);margin-top:2px;font-family:'DM Mono',monospace;}
.health-row{display:flex;align-items:center;gap:9px;margin-bottom:9px;}
.health-label{font-size:10px;color:var(--atext-mid);width:110px;flex-shrink:0;}
.health-track{flex:1;height:4px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden;}
.health-fill{height:100%;border-radius:2px;transition:width 0.6s ease;}
.health-val{font-size:10px;font-weight:600;width:34px;text-align:right;flex-shrink:0;font-family:'DM Mono',monospace;}
.dispute-card{background:var(--abg3);border:1px solid var(--aborder);border-radius:9px;padding:13px 14px;margin-bottom:9px;transition:border-color 0.2s;}
.dispute-card.urgent{border-color:var(--red-border);background:rgba(239,68,68,0.04);}
.checklist-item{display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--aborder);font-size:12px;color:var(--atext-mid);}
.checklist-item:last-child{border-bottom:none;}
.check-icon{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
.check-pass{background:var(--green-bg);color:var(--green);}
.check-fail{background:var(--red-bg);color:var(--red);}
.act-btn{padding:5px 11px;border-radius:6px;font-size:10px;font-weight:600;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;letter-spacing:0.2px;}
.act-approve{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border);}
.act-approve:hover{background:var(--green);color:white;}
.act-reject{background:var(--red-bg);color:var(--red);border:1px solid var(--red-border);}
.act-reject:hover{background:var(--red);color:white;}
.act-view{background:rgba(255,255,255,0.06);color:var(--atext-mid);border:1px solid var(--aborder);}
.act-view:hover{border-color:var(--aborder2);color:var(--atext);}
.mono{font-family:'DM Mono',monospace;font-size:11px;}

/* ── SUCCESS SCREEN ── */
.success-screen{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 40px;animation:fadeUp 0.5s ease;}
.success-icon{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 22px;}
.success-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--navy);margin-bottom:10px;}
.success-sub{font-size:13px;color:var(--text-muted);font-weight:300;max-width:400px;line-height:1.7;margin-bottom:28px;}

/* ── MODAL ── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:500;padding:20px;}
.modal{background:var(--abg2);border:1px solid var(--aborder2);border-radius:14px;width:100%;max-width:500px;overflow:hidden;animation:fadeUp 0.2s ease;}
.modal-hd{padding:16px 20px;border-bottom:1px solid var(--aborder);display:flex;align-items:center;justify-content:space-between;}
.modal-title{font-size:14px;font-weight:700;color:var(--atext);}
.modal-close{background:none;border:none;color:var(--atext-muted);font-size:18px;cursor:pointer;line-height:1;}
.modal-body{padding:20px;}
.modal-footer{padding:12px 20px;border-top:1px solid var(--aborder);display:flex;gap:8px;justify-content:flex-end;}
.btn-approve-modal{padding:8px 18px;background:var(--green);color:white;border-radius:7px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-deny-modal{padding:8px 16px;background:var(--red-bg);color:var(--red);border-radius:7px;font-size:12px;font-weight:600;border:1px solid var(--red-border);cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-cancel-modal{padding:8px 16px;background:none;color:var(--atext-muted);border-radius:7px;font-size:12px;font-weight:500;border:1px solid var(--aborder);cursor:pointer;font-family:'DM Sans',sans-serif;}

/* ── LANDING PRICING ── */
.pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:800px;margin:0 auto;}
.pricing-card{background:white;border-radius:20px;border:2px solid var(--border);padding:36px 32px;position:relative;transition:all 0.3s;}
.pricing-card.featured{border-color:var(--gold);box-shadow:0 20px 60px rgba(232,224,208,0.15);}
.pricing-card-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--gold),var(--gold-light));color:var(--navy);padding:4px 16px;border-radius:100px;font-size:11px;font-weight:700;white-space:nowrap;}
.pricing-role{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:10px;}
.pricing-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:var(--navy);margin-bottom:6px;}
.pricing-price{font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:var(--navy);line-height:1;margin-bottom:4px;}
.pricing-price span{font-size:18px;font-weight:400;color:var(--text-muted);font-family:'DM Sans',sans-serif;}
.pricing-desc{font-size:14px;color:var(--text-muted);font-weight:300;margin-bottom:24px;line-height:1.6;}
.pricing-features{list-style:none;display:flex;flex-direction:column;gap:11px;margin-bottom:28px;}
.pricing-feature{display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--text-mid);}
.pricing-feature-icon{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gold-light));display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-top:1px;}
/* ── LANDING TESTIMONIALS ── */
.testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.testimonial-card{background:white;border-radius:16px;border:1px solid var(--border);padding:24px;transition:all 0.2s;}
.testimonial-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.07);}
/* ── LANDING FAQ ── */
.faq-item{border-bottom:1px solid var(--border);overflow:hidden;}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:18px 0;cursor:pointer;font-size:15px;font-weight:600;color:var(--navy);}
.faq-a{font-size:14px;color:var(--text-muted);line-height:1.7;font-weight:300;padding-bottom:16px;}
/* ── LANDING ROLE TOGGLE ── */
.role-toggle{display:inline-flex;background:var(--cream-dark);border-radius:100px;padding:4px;margin-bottom:40px;}
.role-toggle-btn{padding:8px 24px;border-radius:100px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;color:var(--text-muted);background:none;}
.role-toggle-btn.active{background:var(--navy);color:white;box-shadow:0 2px 8px rgba(0,0,0,0.15);}

/* ── AVAILABILITY CALENDAR ── */
.avail-cal{background:white;border-radius:16px;border:1px solid var(--border);overflow:hidden;}
.avail-cal-header{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.avail-cal-title{font-size:13px;font-weight:700;color:var(--navy);}
.avail-cal-nav{display:flex;gap:6px;}
.avail-cal-nav button{width:28px;height:28px;border-radius:6px;border:1px solid var(--border);background:white;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}
.avail-cal-nav button:hover{background:var(--cream);border-color:var(--navy);}
.avail-cal-grid{padding:14px;}
.avail-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:6px;}
.avail-cal-dow span{text-align:center;font-size:10px;font-weight:600;color:var(--text-muted);letter-spacing:0.3px;padding:4px 0;}
.avail-cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
.avail-day{aspect-ratio:1;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.15s;border:1.5px solid transparent;user-select:none;}
.avail-day.empty{cursor:default;}
.avail-day.past{color:var(--text-muted);opacity:0.4;cursor:default;}
.avail-day.available{background:rgba(34,197,94,0.12);color:var(--success);border-color:rgba(34,197,94,0.25);}
.avail-day.available:hover{background:rgba(34,197,94,0.2);border-color:rgba(34,197,94,0.4);}
.avail-day.unavailable{background:rgba(239,68,68,0.08);color:var(--danger);border-color:rgba(239,68,68,0.15);}
.avail-day.unavailable:hover{background:rgba(239,68,68,0.15);}
.avail-day.today{background:var(--navy);color:white;border-color:var(--navy);}
.avail-day.default{background:var(--cream);color:var(--text-mid);}
.avail-day.default:hover{background:var(--cream-dark);border-color:var(--border);}
.avail-legend{display:flex;gap:14px;padding:10px 14px;border-top:1px solid var(--border);flex-wrap:wrap;}
.avail-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);}
.avail-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
/* ── VENDOR ROWS ── */
.vendor-row{
  display:flex;align-items:center;gap:16px;padding:16px 22px;
  border-bottom:none;cursor:pointer;transition:all 0.18s;
  background:white;border-radius:12px;margin-bottom:8px;
  border:1px solid rgba(42,53,32,0.09);
  box-shadow:0 1px 3px rgba(42,53,32,0.04);
}
.vendor-row:last-child{border-bottom:none;}
.vendor-row:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(42,53,32,0.1);border-color:rgba(42,53,32,0.16);}
.vendor-row-avatar{
  width:44px;height:44px;border-radius:11px;
  background:var(--navy);display:flex;align-items:center;
  justify-content:center;font-size:13px;font-weight:700;
  flex-shrink:0;color:var(--gold-light);letter-spacing:0.5px;
}
.vendor-row-body{flex:1;min-width:0;}
.vendor-row-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--navy);margin-bottom:3px;}
.vendor-row-meta{font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:8px;}
.vendor-row-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0;}

/* ── MATCH CARDS ── */
.match-card{
  background:white;border-radius:12px;border:1px solid rgba(42,53,32,0.09);
  padding:18px 22px;cursor:pointer;transition:all 0.18s;
  position:relative;display:flex;align-items:center;gap:16px;
  margin-bottom:8px;box-shadow:0 1px 3px rgba(42,53,32,0.04);
}
.match-card:last-child{border-bottom:none;}
.match-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(42,53,32,0.1);border-color:rgba(42,53,32,0.16);}
.match-card-list{display:flex;flex-direction:column;gap:0;border:none;border-radius:0;overflow:visible;background:transparent;margin:0 0 16px;}
.match-score-ring{
  width:48px;height:48px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;position:relative;flex-shrink:0;background:var(--cream);
}
.match-score-text{font-family:'DM Mono',monospace;font-size:11px;font-weight:700;line-height:1;letter-spacing:-0.5px;}
.match-reasons{display:flex;flex-direction:column;gap:3px;margin-top:0;}
.match-reason{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-mid);}
/* ── REFERRAL ── */
.referral-card{background:linear-gradient(135deg,var(--navy) 0%,#1a2e12 100%);border-radius:16px;padding:24px;color:white;position:relative;overflow:hidden;}
.referral-amount{font-family:'Playfair Display',serif;font-size:52px;font-weight:700;color:var(--gold-light);line-height:1;position:relative;z-index:1;}
.referral-copy-box{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s;margin-top:14px;}
.referral-copy-box:hover{background:rgba(255,255,255,0.1);}
.referral-link{font-family:'DM Mono',monospace;font-size:12px;color:rgba(255,255,255,0.6);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.referral-copy-btn{padding:4px 12px;border-radius:6px;background:var(--gold-light);color:var(--navy);font-size:11px;font-weight:700;border:none;cursor:pointer;flex-shrink:0;font-family:'DM Sans',sans-serif;}
/* ── LEGAL ── */
.legal-doc-card{background:white;border-radius:14px;border:1.5px solid var(--border);overflow:hidden;transition:all 0.2s;cursor:pointer;}
.legal-doc-card:hover{border-color:var(--gold);box-shadow:0 6px 20px rgba(0,0,0,0.06);}
.legal-doc-icon{width:44px;height:44px;border-radius:11px;background:linear-gradient(135deg,var(--navy),var(--navy-light));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.nda-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);}
.toggle-track{width:40px;height:22px;border-radius:100px;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
.toggle-thumb{position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);}
/* ── MINISTRY FUND ── */
.fund-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:100px;font-size:12px;font-weight:600;color:#16A34A;margin-bottom:20px;}
.fund-strip{background:rgba(34,197,94,0.06);border-top:1px solid rgba(34,197,94,0.12);padding:14px 48px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:13px;color:#16A34A;font-weight:500;}
/* ── GLOW EFFECTS ── */
@keyframes glowFloat{0%,100%{transform:translateY(0);opacity:0.6;}50%{transform:translateY(-8px);opacity:1;}}
@keyframes orbPulse{0%,100%{transform:scale(1);opacity:0.12;}50%{transform:scale(1.15);opacity:0.22;}}
@keyframes heroShimmer{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
.glow-orb{position:absolute;border-radius:50%;pointer-events:none;animation:orbPulse 6s ease-in-out infinite;}
.hero-glow-1{width:500px;height:500px;top:-120px;left:-100px;background:radial-gradient(circle,rgba(232,224,208,0.18) 0%,transparent 70%);animation-delay:0s;}
.hero-glow-2{width:400px;height:400px;top:60px;right:-80px;background:radial-gradient(circle,rgba(232,224,208,0.12) 0%,transparent 70%);animation-delay:2s;}
.hero-glow-3{width:300px;height:300px;bottom:-60px;left:40%;background:radial-gradient(circle,rgba(232,224,208,0.1) 0%,transparent 70%);animation-delay:4s;}
.cross-glow{filter:drop-shadow(0 0 12px rgba(232,224,208,0.5)) drop-shadow(0 0 28px rgba(232,224,208,0.25)) drop-shadow(0 0 60px rgba(232,224,208,0.12));}
.stat-glow{text-shadow:0 0 20px rgba(232,224,208,0.4);}
.cta-glow:hover{box-shadow:0 8px 32px rgba(232,224,208,0.3),0 0 60px rgba(232,224,208,0.1)!important;}
.section-glow{position:relative;overflow:hidden;}
.section-glow::before{content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:600px;height:400px;background:radial-gradient(ellipse,rgba(232,224,208,0.06) 0%,transparent 70%);pointer-events:none;}

/* ── LANDING ANIMATIONS ── */
@keyframes fadeInUp{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeInDown{from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);}}
@keyframes crossDrop{from{opacity:0;transform:translateY(-40px) rotate(-5deg);}to{opacity:1;transform:translateY(0) rotate(0deg);}}
@keyframes glowPulse{0%,100%{filter:drop-shadow(0 4px 24px rgba(232,224,208,0.3));}50%{filter:drop-shadow(0 4px 40px rgba(232,224,208,0.7));}}
@keyframes countUp{from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);}}
@keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
.land-animate-in{animation:fadeInUp 0.7s ease both;}
.land-animate-in-d1{animation:fadeInUp 0.7s 0.1s ease both;}
.land-animate-in-d2{animation:fadeInUp 0.7s 0.2s ease both;}
.land-animate-in-d3{animation:fadeInUp 0.7s 0.35s ease both;}
.land-animate-in-d4{animation:fadeInUp 0.7s 0.5s ease both;}
.cross-animate{animation:crossDrop 0.9s cubic-bezier(0.34,1.56,0.64,1) both, glowPulse 3s 1s ease-in-out infinite;}
.hiw-card-hover{transition:all 0.3s;}
.hiw-card-hover:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.1);border-color:var(--gold);}
.cat-card-hover{transition:all 0.25s;}
.cat-card-hover:hover{transform:translateY(-4px);box-shadow:0 14px 36px rgba(0,0,0,0.09);border-color:rgba(232,224,208,0.4);background:var(--gold-pale);}

@media(max-width:768px){.auth-left-panel{display:none!important;}
  .pricing-grid{grid-template-columns:1fr;}
  .testimonial-grid{grid-template-columns:1fr;}
}

@media(max-width:768px){
  .page{padding:18px 14px;}
  .project-grid,.vendor-grid{border-radius:12px;}
  .detail-layout{grid-template-columns:1fr;}
  .land-hiw{grid-template-columns:1fr;}
  .kpi-grid{grid-template-columns:repeat(2,1fr);}
  .admin-two-col,.admin-three-col{grid-template-columns:1fr;}
  .admin-app{flex-direction:column;}
  .admin-sidenav{width:100%!important;height:auto!important;flex-direction:row!important;overflow-x:auto;min-width:unset!important;border-right:none!important;border-bottom:1px solid var(--aborder);}
  .admin-nav-section{display:flex;flex-direction:row!important;gap:2px!important;padding:8px!important;overflow-x:auto;}
  .admin-nav-label{display:none!important;}
  .admin-nav-item{white-space:nowrap;border-radius:6px!important;font-size:11px!important;}
  .admin-nav-item.active::before{display:none!important;}
  .kpi-grid{grid-template-columns:1fr 1fr;}
  .msg-root{flex-direction:column;height:auto;}
  .inbox{width:100%!important;min-width:unset!important;height:220px;border-right:none;border-bottom:1px solid var(--border);flex-shrink:0;}
  .msg-thread{flex:1;min-height:400px;}
  .msg-input-row{position:sticky;bottom:0;}
  .ps-sidebar{display:none;}
  .nav-tabs .nav-tab{padding:5px 9px;font-size:11px;}
  .land-nav{padding:16px 20px;}
  .land-section{padding:48px 20px;}
  .land-h1{font-size:clamp(28px,8vw,52px);}
  .page-hd{flex-direction:column;gap:12px;}
  .page-hd .btn-primary{align-self:flex-start;}
  .detail-meta-row{gap:10px;}
  .profile-stats-row{gap:14px;}
  .land-cat-grid{grid-template-columns:repeat(2,1fr)!important;}
  .pricing-grid{grid-template-columns:1fr!important;}
  .testimonial-grid{grid-template-columns:1fr!important;}
}
/* ══════════════════════════════════
   VENDOR DIRECTORY — REDESIGNED
   Modern card grid with hover reveal
══════════════════════════════════ */

/* Replace ALL existing .vendor-row, .vendor-card, .vendor-grid CSS with this */

.vendor-page-wrap{max-width:1100px;margin:0 auto;width:100%;padding:28px 28px 48px;}

/* Featured strip */
.vendor-featured-strip{
  background:linear-gradient(135deg,var(--navy) 0%,#1a2e12 100%);
  border-radius:14px;padding:20px 24px;margin-bottom:28px;
  border:1px solid rgba(232,224,208,0.1);position:relative;overflow:hidden;
}
.vendor-featured-strip::before{
  content:'';position:absolute;top:-60px;right:-60px;
  width:200px;height:200px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,224,208,0.08) 0%,transparent 70%);
  pointer-events:none;
}
.vendor-featured-label{
  font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:rgba(232,224,208,0.45);margin-bottom:14px;
}
.vendor-featured-scroll{
  display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;
}
.vendor-featured-scroll::-webkit-scrollbar{display:none;}
.vendor-featured-chip{
  display:flex;align-items:center;gap:10px;
  padding:10px 16px;border-radius:10px;
  background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  cursor:pointer;transition:all 0.2s;flex-shrink:0;white-space:nowrap;
}
.vendor-featured-chip:hover{background:rgba(255,255,255,0.1);border-color:rgba(232,224,208,0.25);}
.vendor-featured-chip-avatar{
  width:32px;height:32px;border-radius:8px;
  background:linear-gradient(135deg,var(--gold),var(--gold-light));
  display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:var(--navy);flex-shrink:0;
}
.vendor-featured-chip-name{font-size:12px;font-weight:700;color:white;}
.vendor-featured-chip-cat{font-size:10px;color:rgba(255,255,255,0.45);margin-top:1px;}
.vendor-featured-chip-badge{
  margin-left:4px;padding:2px 6px;border-radius:100px;
  background:rgba(232,224,208,0.12);border:1px solid rgba(232,224,208,0.2);
  font-size:8px;font-weight:700;color:var(--gold-light);letter-spacing:0.5px;
}

/* Category filter bar */
.vendor-cat-bar{
  display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
  padding-bottom:4px;margin-bottom:20px;flex-wrap:nowrap;
}
.vendor-cat-bar::-webkit-scrollbar{display:none;}
.vendor-cat-pill{
  display:flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:100px;flex-shrink:0;
  border:1px solid rgba(42,53,32,0.15);background:white;
  cursor:pointer;transition:all 0.15s;font-size:11px;
  font-weight:600;color:var(--text-muted);letter-spacing:0.3px;
  white-space:nowrap;font-family:'DM Sans',sans-serif;
}
.vendor-cat-pill:hover{border-color:var(--navy);color:var(--navy);}
.vendor-cat-pill.active{background:var(--navy);border-color:var(--navy);color:var(--gold-light);}
.vendor-cat-pill-icon{font-size:12px;}

/* ── VENDOR CARDS — clean horizontal redesign ── */
.vendor-tile-grid{display:flex;flex-direction:column;gap:10px;}

.vendor-tile{
  background:white;border-radius:16px;cursor:pointer;
  border:1px solid rgba(42,53,32,0.09);
  box-shadow:0 1px 4px rgba(42,53,32,0.05);
  transition:all 0.2s cubic-bezier(0.34,1.1,0.64,1);
  overflow:hidden;display:flex;align-items:stretch;
}
.vendor-tile:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 32px rgba(42,53,32,0.11);
  border-color:rgba(42,53,32,0.16);
}
.vendor-tile.verified{border-color:rgba(232,224,208,0.4);}
.vendor-tile.verified:hover{border-color:rgba(232,224,208,0.7);box-shadow:0 10px 32px rgba(42,53,32,0.1),0 0 0 1px rgba(232,224,208,0.25);}

/* Left accent */
.vendor-tile-accent{width:4px;flex-shrink:0;border-radius:16px 0 0 16px;background:var(--navy);}
.vendor-tile.verified .vendor-tile-accent{background:linear-gradient(180deg,var(--gold),var(--gold-light));}

/* Avatar */
.vendor-tile-avatar{
  width:52px;height:52px;border-radius:14px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:17px;font-weight:800;letter-spacing:0.5px;
  background:linear-gradient(135deg,var(--navy),#1a3215);
  color:var(--gold-light);
}

/* Main body */
.vendor-tile-body{flex:1;padding:16px 18px;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:5px;}
.vendor-tile-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--navy);line-height:1.2;}
.vendor-tile-cat{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--text-muted);}
.vendor-tile-bio{font-size:12px;color:var(--text-mid);line-height:1.55;font-weight:300;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}
.vendor-tile-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px;}
.vendor-tile-tag{padding:2px 8px;borderRadius:100px;background:var(--cream-dark);font-size:10px;font-weight:500;color:var(--text-mid);border-radius:100px;}
.vendor-tile-verified-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:100px;background:rgba(232,224,208,0.3);border:1px solid rgba(232,224,208,0.5);font-size:9px;font-weight:700;color:var(--gold-text);letter-spacing:0.5px;}

/* Right meta */
.vendor-tile-meta{
  display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;
  padding:16px 18px;flex-shrink:0;min-width:130px;gap:8px;
  border-left:1px solid rgba(42,53,32,0.06);background:rgba(250,246,239,0.4);
  border-radius:0 16px 16px 0;
}
.vendor-tile-rating{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:700;color:var(--navy);}
.vendor-tile-rating-stars{color:#ca8a04;font-size:11px;}
.vendor-tile-reviews{font-size:10px;color:var(--text-muted);font-weight:400;}
.vendor-tile-location{font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:3px;}
.vendor-tile-cta{
  padding:6px 14px;border-radius:8px;border:1.5px solid rgba(42,53,32,0.15);
  background:white;color:var(--navy);font-size:11px;font-weight:600;
  cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;white-space:nowrap;
}
.vendor-tile-cta:hover{background:var(--navy);color:var(--gold-light);border-color:var(--navy);}

/* Keep old classes referenced elsewhere from breaking */
.vendor-tile-cover{display:none;}
.vendor-tile-cover-inner{display:none;}
.vendor-tile-cover-pattern{display:none;}
.vendor-tile-verified-glow{display:none;}
.vendor-tile-overlay{display:none;}
.vendor-tile-footer{display:none;}
.vendor-tile-overlay-bio{display:none;}
.vendor-tile-overlay-tags{display:none;}
.vendor-tile-overlay-tag{
.vendor-tile-overlay-btn{
  width:100%;padding:10px;background:linear-gradient(135deg,var(--gold),var(--gold-light));
  color:var(--navy);border:none;border-radius:9px;
  font-size:12px;font-weight:700;cursor:pointer;
  font-family:'DM Sans',sans-serif;transition:all 0.2s;
  display:flex;align-items:center;justify-content:center;gap:6px;
}
.vendor-tile-overlay-btn:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(232,224,208,0.4);}

@media(max-width:480px){
  .topnav{padding:0 14px;}
  .nav-tabs{gap:0;}
  .nav-tabs .nav-tab{padding:5px 7px;font-size:10px;}
  .land-stats{gap:24px;}
  .land-stat-num{font-size:24px;}
  .kpi-grid{grid-template-columns:1fr 1fr;}
  .land-cat-grid{grid-template-columns:1fr!important;}
  .board-filters{flex-wrap:wrap;}
  .board-search{min-width:100%!important;}
}
`;

/* ══════════════════════════════════
   SHARED DATA
══════════════════════════════════ */
const CATEGORIES = [
  {icon:"♩",label:"Worship & Music",count:84,desc:"Worship leaders, bands, music directors, songwriters"},
  {icon:"▶",label:"Creative Media",count:74,desc:"Video production, photography, graphic design, branding"},
  {icon:"◇",label:"Children & Youth Ministry",count:53,desc:"Children's directors, curriculum, VBS, teen ministry"},
  {icon:"◉",label:"Speaking, Coaching & Consulting",count:61,desc:"Speakers, life coaches, church consultants, leadership"},
  {icon:"◈",label:"Tech / AV / Production",count:92,desc:"Sound, lighting, livestream, AVL systems, IT"},
  {icon:"▲",label:"Construction & Renovation",count:48,desc:"Contractors, architects, interior design, facilities"},
  {icon:"◻",label:"Web & Technology",count:91,desc:"Websites, apps, software, IT support"},
  {icon:"$",label:"Accounting & Finance",count:37,desc:"CPAs, bookkeeping, audits, 990 filings"},
  {icon:"§",label:"Legal Services",count:19,desc:"Church law, contracts, HR, compliance"},
  {icon:"◎",label:"Marketing & Communications",count:55,desc:"Social media, PR, advertising, copywriting"},
];
const BUDGETS = ["Under $500","$500–$1,000","$1,000–$2,500","$2,500–$5,000","$5,000–$10,000","$10,000–$25,000","$25,000+"];
const TIMELINES = ["ASAP (within 1 week)","2–4 weeks","1–2 months","3–6 months","6+ months","Flexible"];
const STAR_LABELS = ["","Poor","Fair","Good","Great","Outstanding"];
const HIGHLIGHT_TAGS = ["Outstanding Communication","Above & Beyond","Faith-Aligned","Would Rehire","Budget-Friendly","Creative Excellence","Professional","On Time","Great Value","Highly Recommend"];
const QUICK_REPLIES = ["Sounds great.","When can we schedule a call?","Can you send more details?","I'll review and get back to you."];

const MOCK_PROJECTS = [
  {id:1,title:"Full Website Redesign & SEO Overhaul",church:"Grace Fellowship Church",city:"Dallas, TX",category:"Web & Technology",icon:"Web",budget:"$2,500–$5,000",timeline:"1–2 months",bids:7,status:"open",urgent:false,posted:"2 days ago",desc:"We need a complete redesign of our church website including new branding integration, sermon archive, online giving, and mobile responsiveness.",skills:["WordPress","UX Design","SEO","Mobile Design"],requirements:["Portfolio of church websites required","Must be available for weekly check-ins","Experience with sermon media integration preferred"],scope:"One-time project"},
  {id:2,title:"Sound System Installation — New Sanctuary",church:"Calvary Baptist Church",city:"Nashville, TN",category:"AV & Media Production",icon:"",budget:"$10,000–$25,000",timeline:"2–4 weeks",bids:3,status:"open",urgent:true,posted:"5 hours ago",desc:"Our new sanctuary seats 800 and needs a complete professional sound system including main PA, stage monitors, and mixing console.",skills:["AV Installation","Acoustic Design","System Integration"],requirements:["Licensed contractor required","Must provide 3 references","Willing to work with our building contractor"],scope:"Large project"},
  {id:3,title:"Annual Financial Audit & 990 Filing",church:"New Life Community Church",city:"Charlotte, NC",category:"Accounting & Finance",icon:"Finance",budget:"$1,000–$2,500",timeline:"1–2 months",bids:5,status:"review",urgent:false,posted:"1 week ago",desc:"Looking for a CPA experienced with nonprofit and church accounting to perform our annual audit and prepare our 990 filing.",skills:["CPA","Nonprofit Accounting","990 Filing"],requirements:["Active CPA license required","Nonprofit/church experience mandatory"],scope:"One-time project"},
  {id:4,title:"Sermon Graphics & Social Media Templates",church:"Elevation Ministries",city:"Atlanta, GA",category:"Graphic Design & Branding",icon:"Design",budget:"$500–$1,000",timeline:"2–4 weeks",bids:12,status:"open",urgent:false,posted:"3 days ago",desc:"Need a complete set of sermon series graphics and social media templates for our upcoming spring series.",skills:["Adobe Creative Suite","Social Media Design","Print Design"],requirements:["Church design portfolio required","Must match our existing brand aesthetic"],scope:"One-time project"},
  {id:5,title:"Youth Wing Renovation — Phase 2",church:"First Baptist Riverside",city:"Riverside, CA",category:"Construction & Renovation",icon:"Const",budget:"$25,000+",timeline:"3–6 months",bids:2,status:"open",urgent:false,posted:"4 days ago",desc:"Phase 2 of our youth center renovation includes new flooring, lighting overhaul, restroom remodel, and creation of a tech room.",skills:["General Contracting","Interior Renovation","Electrical"],requirements:["CA contractor license required","$1M liability insurance required"],scope:"Large project"},
  {id:6,title:"Monthly Bookkeeping & Payroll",church:"The Bridge Church",city:"Denver, CO",category:"Accounting & Finance",icon:"Finance",budget:"$500–$1,000",timeline:"Flexible",bids:4,status:"open",urgent:false,posted:"1 week ago",desc:"Seeking a reliable bookkeeper for ongoing monthly services. 12 staff on payroll, roughly 200 transactions/month.",skills:["QuickBooks","Payroll Processing","Bookkeeping"],requirements:["QuickBooks certified preferred","Monthly availability guaranteed"],scope:"Ongoing work"},
];
const MOCK_BIDS = [
  {id:1,vendor:"Cornerstone Creative Co.",emoji:"Design",category:"Graphic Design",rating:4.9,reviews:24,amount:3800,timeline:"3 weeks",note:"Includes 3 revision rounds. We've completed 30+ church websites.",hired:false,declined:false},
  {id:2,vendor:"Kingdom Tech Solutions",emoji:"Web",category:"Web & Technology",rating:4.8,reviews:18,amount:4200,timeline:"6 weeks",note:"Full project management included. We offer lifetime support for all church clients.",hired:false,declined:false},
  {id:3,vendor:"FaithWeb Design",emoji:"Web",category:"Web & Technology",rating:4.5,reviews:9,amount:2900,timeline:"4 weeks",note:"Focused exclusively on church websites since 2017.",hired:false,declined:false},
  {id:4,vendor:"Digital Disciples",emoji:"Faith",category:"Web & Technology",rating:4.7,reviews:31,amount:3500,timeline:"5 weeks",note:"We offer ongoing maintenance plans at no extra cost for the first year.",hired:false,declined:false},
];
const MOCK_VENDORS = [
  {id:1,emoji:"Design",name:"Cornerstone Creative Co.",category:"Graphic Design & Branding",city:"Dallas, TX",bio:"Faith-driven design studio specializing in church branding, sermon graphics, and digital media. We've served 80+ ministries.",rating:4.9,reviews:24,projects:31,cover:"#1E3050",verified:true,tags:["Faith-Verified","Top Rated"]},
  {id:2,emoji:"Web",name:"Kingdom Tech Solutions",category:"Web & Technology",city:"Nashville, TN",bio:"Full-stack web agency building digital homes for churches. Planning Center integration specialists.",rating:4.8,reviews:18,projects:22,cover:"#162032",verified:true,tags:["Faith-Verified","Rising Star"]},
  {id:3,emoji:"Finance",name:"Grace & Numbers CPA",category:"Accounting & Finance",city:"Atlanta, GA",bio:"Certified public accountant specializing in nonprofit and church bookkeeping, audits, and 990 filings.",rating:5.0,reviews:12,projects:18,cover:"#1a2a1a",verified:true,tags:["Faith-Verified","Top Rated"]},
  {id:4,emoji:"",name:"Faithful AV & Media",category:"AV & Media Production",city:"Houston, TX",bio:"Professional AV installation and live production services for churches of all sizes. Licensed contractor.",rating:4.7,reviews:31,projects:44,cover:"#2a1a1a",verified:true,tags:["Faith-Verified"]},
  {id:5,emoji:"Const",name:"Blessed Builds LLC",category:"Construction & Renovation",city:"Phoenix, AZ",bio:"Faith-based general contractor specializing in church renovations and new construction.",rating:4.6,reviews:9,projects:11,cover:"#1a1a2a",verified:false,tags:[]},
  {id:6,emoji:"Legal",name:"Kingdom Counsel Law",category:"Legal Services",city:"Charlotte, NC",bio:"Church and nonprofit law specialists. Helping ministries navigate compliance, real estate, and employment law.",rating:4.9,reviews:15,projects:20,cover:"#1E3050",verified:true,tags:["Faith-Verified"]},
];
const MOCK_CONVOS = [
  {id:1,name:"Cornerstone Creative Co.",emoji:"Design",type:"vendor",project:"Website Redesign — Grace Fellowship",status:"hired",online:true,unread:2,time:"2m ago",preview:"I'll have the first mockups ready by Thursday...",messages:[
    {id:1,from:"them",type:"text",text:"Hi Pastor David! Thank you so much for accepting our bid. We're truly excited to work on this project with Grace Fellowship.",time:"9:00 AM"},
    {id:2,from:"me",type:"text",text:"Welcome Marcus! We're excited too. What are your initial thoughts?",time:"9:15 AM"},
    {id:3,from:"them",type:"file",fileName:"Church_Website_Intake_Form.pdf",fileSize:"245 KB",fileIcon:"PDF",time:"9:35 AM"},
    {id:4,from:"me",type:"text",text:"Got it, I'll have this filled out before our call. Quick question — do you have experience integrating Planning Center?",time:"10:02 AM"},
    {id:5,from:"them",type:"text",text:"Absolutely — we've integrated Planning Center on 12 church sites. It's one of our specialties.",time:"10:08 AM"},
    {id:6,from:"them",type:"text",text:"I'll have the first mockups ready by Thursday before our call so we have something visual to discuss.",time:"10:28 AM"},
  ]},
  {id:2,name:"Kingdom Tech Solutions",emoji:"Web",type:"vendor",project:"App Development — Elevation Ministries",status:"open",online:false,unread:0,time:"Yesterday",preview:"We can start as soon as the contract is signed.",messages:[
    {id:1,from:"them",type:"text",text:"Hi! We submitted a bid on your app development project. We'd love to walk you through our proposal.",time:"Yesterday 3:00 PM"},
    {id:2,from:"me",type:"text",text:"Thanks for reaching out. We're still reviewing bids but yours looks strong.",time:"Yesterday 4:15 PM"},
    {id:3,from:"them",type:"text",text:"We can start as soon as the contract is signed.",time:"Yesterday 4:20 PM"},
  ]},
  {id:3,name:"Calvary Baptist Church",emoji:"CH",type:"church",project:"Sound System Installation",status:"hired",online:false,unread:0,time:"2 days ago",preview:"The site walk-through is confirmed for Monday.",messages:[
    {id:1,from:"them",type:"text",text:"Hi! Just confirming — the site walk-through is confirmed for Monday at 10am.",time:"2 days ago"},
    {id:2,from:"me",type:"text",text:"Confirmed! We'll bring the equipment spec sheets.",time:"2 days ago"},
  ]},
];
const MOCK_REVIEWS = [
  {id:1,author:"Grace Fellowship Church",avatar:"CH",city:"Dallas, TX",project:"Website Redesign & SEO Overhaul",rating:5,date:"Feb 2025",featured:true,verified:true,helpful:14,body:"Working with Cornerstone Creative was one of the best vendor experiences we've had. They didn't just build us a website — they understood our heart, our mission, and our community. Online giving went up 34% in the first month.",cats:[{label:"Communication",stars:5},{label:"Quality",stars:5},{label:"Timeline",stars:5},{label:"Value",stars:5}],tags:["Rehire","Faith-Aligned","Above & Beyond"],recommend:true,reply:"Pastor David — we are so grateful. Getting to serve Grace Fellowship was a true blessing."},
  {id:2,author:"Elevation Ministries",avatar:"Faith",city:"Atlanta, GA",project:"Brand Identity & Sermon Graphics",rating:5,date:"Jan 2025",featured:false,verified:true,helpful:9,body:"The team brought our vision to life in ways we didn't even imagine. Multiple visitors say our branding is what made them feel welcome online before they ever walked through the door.",cats:[{label:"Communication",stars:5},{label:"Quality",stars:5},{label:"Timeline",stars:4},{label:"Value",stars:5}],tags:["Rehire","Professional","Creative"],recommend:true,reply:null},
  {id:3,author:"Calvary Baptist Church",avatar:"CH",city:"Nashville, TN",project:"Social Media Templates Package",rating:4,date:"Dec 2024",featured:false,verified:true,helpful:6,body:"Really solid work overall. The templates are beautiful and our social media engagement has improved noticeably. We did need to go through a few extra revision rounds to get the color palette right, but they were patient and responsive.",cats:[{label:"Communication",stars:4},{label:"Quality",stars:5},{label:"Timeline",stars:3},{label:"Value",stars:4}],tags:["Good Communication","Quality Work"],recommend:true,reply:null},
];
const PENDING_VENDORS_DATA = [
  {id:1,name:"Summit Sound & AV",emoji:"",category:"AV & Media Production",city:"Phoenix, AZ",joined:"2h ago",email:"info@summitsound.com",statement:"We've served 40+ churches across Arizona since 2015. Our faith drives every install.",checks:{license:true,insurance:true,faith:true,portfolio:true,email:true},tier:"Pro"},
  {id:2,name:"Blessed Builds LLC",emoji:"Const",category:"Construction & Renovation",city:"Houston, TX",joined:"5h ago",email:"admin@blessedbuilds.com",statement:"Faith-based contractor specializing in church renovations. Licensed & bonded in TX.",checks:{license:true,insurance:true,faith:true,portfolio:false,email:true},tier:"Basic"},
  {id:3,name:"Kingdom Counsel Law",emoji:"Legal",category:"Legal Services",city:"Atlanta, GA",joined:"Yesterday",email:"intake@kingdomcounsel.com",statement:"Non-profit & church law specialists. We've helped 200+ ministries.",checks:{license:true,insurance:true,faith:true,portfolio:true,email:true},tier:"Pro"},
  {id:4,name:"Digital Disciple Co.",emoji:"Marketing",category:"Marketing & Consulting",city:"Charlotte, NC",joined:"2 days ago",email:"hello@digitaldisciple.co",statement:"We help ministries grow their digital presence with integrity.",checks:{license:false,insurance:true,faith:true,portfolio:true,email:false},tier:"Basic"},
];
const ADMIN_ACTIVITY = [
  {color:"var(--green)",text:<>New vendor <strong>Summit Sound & AV</strong> submitted for approval</>,time:"2m ago"},
  {color:"var(--blue2)",text:<><strong>Grace Fellowship Church</strong> posted a new $12,000 project</>,time:"15m ago"},
  {color:"var(--gold)",text:<><strong>Kingdom Tech Solutions</strong> upgraded to Pro plan</>,time:"32m ago"},
  {color:"var(--green)",text:<>Project hired: <strong>Cornerstone Creative</strong> — $4,200</>,time:"1h ago"},
  {color:"var(--red)",text:<>Dispute opened on project <strong>#2847</strong></>,time:"2h ago"},
  {color:"var(--green)",text:<>Stripe payout of <strong>$8,432</strong> processed successfully</>,time:"6h ago"},
];
const MRR_BARS = [{label:"Aug",v:18},{label:"Sep",v:24},{label:"Oct",v:31},{label:"Nov",v:28},{label:"Dec",v:42},{label:"Jan",v:56},{label:"Feb",v:68},{label:"Mar",v:82}];
const HEALTH_DATA = [
  {label:"Server Uptime",val:99.9,color:"var(--green)"},{label:"Email Delivery",val:97.2,color:"var(--green)"},
  {label:"Payment Success",val:98.7,color:"var(--green)"},{label:"Review Rate",val:64,color:"var(--amber)"},
  {label:"Bid Rate",val:81,color:"var(--green)"},{label:"Dispute Rate",val:2.3,color:"var(--green)"},
];
const ADMIN_NAV = [
  {id:"overview",icon:"⬛",label:"Overview"},
  {id:"approvals",icon:"",label:"Approvals",badge:4,badgeColor:"amber"},
  {id:"users",icon:"",label:"Users"},
  {id:"revenue",icon:"",label:"Revenue"},
  {id:"disputes",icon:"!",label:"Disputes",badge:1,badgeColor:"red"},
  {id:"settings",icon:"·",label:"Settings"},
];
const PS_MILESTONES = [
  {label:"Discovery & Planning",pct:25,status:"done"},
  {label:"Design Mockups",pct:25,status:"active"},
  {label:"Development",pct:30,status:"todo"},
  {label:"Launch & Handoff",pct:20,status:"todo"},
];

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function starFill(n){return "★".repeat(n);}
function statusBadge(status,urgent){
  if(urgent) return <span className="status-badge sb-urgent"> Urgent</span>;
  if(status==="open") return <span className="status-badge sb-open">Open</span>;
  if(status==="review") return <span className="status-badge sb-review">In Review</span>;
  if(status==="hired") return <span className="status-badge sb-hired">Hired</span>;
  return <span className="status-badge sb-open">Open</span>;
}
function formatNow(){return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}

/* ══════════════════════════════════
   CROSS LOGO COMPONENT
══════════════════════════════════ */
function CrossLogo({ size = 48 }) {
  return (
    <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{width:size, height:size, display:"block", flexShrink:0}}>
      <path d="M110,210 L210,210 L210,10 L10,10 L10,110"
        stroke="#D4C9B0" strokeWidth="3" fill="none" strokeLinecap="square" strokeLinejoin="miter"/>
      <text x="110" y="110" textAnchor="middle" dominantBaseline="central" fill="#D4C9B0"
        fontFamily="'Palatino Linotype',Palatino,'Book Antiqua',serif" fontSize="90" fontWeight="400">K</text>
    </svg>
  );
}

/* ══════════════════════════════════
   MAIN APP
══════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [role, setRole] = useState("church");
  const [toast, setToast] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Detect password reset token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setScreen("reset-password");
      return;
    }
    // Restore session on page load only — no onAuthStateChange to avoid blocking signIn
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user || null;
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from("profiles").select("role, org_name, onboarding_complete").eq("id", user.id).maybeSingle();
        if (profile) {
          setUserProfile(profile);
          setRole(profile.role || "church");
          setScreen(s => (s === "landing" || s === "auth") ? "projects" : s);
        }
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setMenuOpen(false);
    setScreen("landing");
  };

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2800); };
  const PROTECTED = ["matches","messages","reviews","profile","verify-profile","settings","admin"];
  const nav = (s) => {
    if (PROTECTED.includes(s) && !currentUser) { setScreen("auth"); setMenuOpen(false); return; }
    setScreen(s);
    setMenuOpen(false);
  };

  const MAIN_TABS = [
    {id:"projects",label:"Projects"},
    {id:"vendors",label:"Vendors"},
    {id:"matches",label:"Matches"},
    {id:"messages",label:"Messages"},
    {id:"reviews",label:"Reviews"},
    {id:"admin",label:"Admin"},
  ];

  const initials = userProfile?.org_name
    ? userProfile.org_name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()
    : "?";
  const roleIcon = role === "vendor" ? "" : "CH";

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:css}}/>
      <div onClick={()=>menuOpen&&setMenuOpen(false)}>
        {/* ── TOP NAV — always visible except landing/auth ── */}
        {screen !== "landing" && screen !== "auth" && (
          <nav className="topnav">
            <div className="logo" onClick={()=>nav("landing")} title="Go to Home">
              <div className="logo-icon"><CrossLogo size={48}/></div>
              <span className="logo-name">Kingdom<span>Bid</span></span>
            </div>
            <div className="nav-tabs">
              {MAIN_TABS.map(t=>(
                <button key={t.id} className={`nav-tab${screen===t.id?" active":""}`} onClick={()=>nav(t.id)}>{t.label}</button>
              ))}
            </div>
            <div className="nav-right" style={{position:"relative",display:"flex",alignItems:"center",gap:8}}>
              {currentUser && <NotificationBell currentUser={currentUser} nav={nav}/>}
              {currentUser ? (
                <>
                  <button
                    onClick={e=>{e.stopPropagation();setMenuOpen(o=>!o);}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px 4px 4px",borderRadius:100,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",cursor:"pointer",transition:"all 0.2s"}}
                  >
                    <div className="nav-av" style={{fontSize:10,fontWeight:700}}>{initials}</div>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:500,maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userProfile?.org_name || "Account"}</span>
                    <span style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>▾</span>
                  </button>
                  {menuOpen && (
                    <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 10px)",right:0,background:"white",border:"1px solid var(--border)",borderRadius:14,boxShadow:"0 16px 48px rgba(0,0,0,0.14)",minWidth:210,zIndex:200,overflow:"hidden",animation:"fadeUp 0.15s ease"}}>
                      <div style={{padding:"16px 18px",borderBottom:"1px solid var(--border)"}}>
                        <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:3,letterSpacing:-0.2}}>{userProfile?.org_name || "Your Account"}</div>
                        <div style={{fontSize:11,color:"var(--text-muted)",letterSpacing:0.3}}>{role === "vendor" ? "Service Provider" : "Church / Ministry"}</div>
                      </div>
                      <div style={{padding:"8px"}}>
                        {[
                          {label:"My Profile",  action:()=>nav("profile")},
                          {label:"Settings",    action:()=>nav("settings")},
                        ].map((item,i)=>(
                          <button key={i} onClick={item.action} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 12px",border:"none",background:"none",borderRadius:8,cursor:"pointer",fontSize:13,color:"var(--text-mid)",fontFamily:"DM Sans,sans-serif",textAlign:"left",fontWeight:500,transition:"background 0.15s"}}>
                            {item.label}
                          </button>
                        ))}
                        <div style={{height:1,background:"var(--border)",margin:"4px 4px"}}/>
                        <button onClick={handleSignOut} style={{display:"flex",alignItems:"center",width:"100%",padding:"10px 12px",border:"none",background:"none",borderRadius:8,cursor:"pointer",fontSize:13,color:"var(--danger)",fontFamily:"DM Sans,sans-serif",textAlign:"left",fontWeight:500}}>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button className="btn-primary" style={{padding:"6px 16px",fontSize:12}} onClick={()=>nav("auth")}>Sign In</button>
              )}
            </div>
          </nav>
        )}

        {/* ── SCREENS ── */}
        {screen==="landing"        && <LandingScreen nav={nav}/>}
        {screen==="auth"           && <AuthScreen nav={nav} setRole={setRole} setCurrentUser={setCurrentUser} setUserProfile={setUserProfile} onOnboard={(r)=>{setRole(r);setScreen("onboarding");}}/>}
        {screen==="onboarding"     && <OnboardingScreen role={role} currentUser={currentUser} nav={nav} showToast={showToast}/>}
        {screen==="reset-password" && <ResetPasswordScreen nav={nav} showToast={showToast}/>}
        {screen==="projects"  && <ProjectsScreen role={role} showToast={showToast} nav={nav}/>}
        {screen==="vendors"   && <VendorsScreen role={role} nav={nav} currentUser={currentUser}/>}
        {screen==="matches"   && <MatchingScreen role={role} currentUser={currentUser} nav={nav}/>}
        {screen==="messages"  && <MessagesScreen role={role}/>}
        {screen==="reviews"   && <ReviewsScreen role={role} showToast={showToast}/>}
        {screen==="admin"     && <AdminScreen showToast={showToast}/>}
        {screen==="profile"   && <ProfileScreen role={role} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} showToast={showToast} nav={nav} initialTab="overview"/>}
        {screen==="verify-profile" && <ProfileScreen role={role} currentUser={currentUser} userProfile={userProfile} setUserProfile={setUserProfile} showToast={showToast} nav={nav} initialTab="verify"/>}
        {screen==="settings"  && <SettingsScreen currentUser={currentUser} showToast={showToast} nav={nav} onSignOut={handleSignOut}/>}
        {screen==="about"     && <AboutScreen nav={nav}/>}
        {screen==="ambassador"&& <AmbassadorScreen nav={nav}/>}
        {screen==="partner"   && <PartnerScreen nav={nav}/>}
      </div>
      {toast && <div className={`toast${toast.toLowerCase().startsWith("error")||toast.toLowerCase().includes("failed")?" toast-error":toast.toLowerCase().startsWith("✓")||toast.toLowerCase().includes("success")||toast.toLowerCase().includes("saved")||toast.toLowerCase().includes("posted")||toast.toLowerCase().includes("hired")||toast.toLowerCase().includes("sent")||toast.toLowerCase().includes("updated")||toast.toLowerCase().includes("published")||toast.toLowerCase().includes("copied")?" toast-success":""}`}>{toast}</div>}
    </>
  );
}

/* ══════════════════════════════════
   PROFILE SCREEN
══════════════════════════════════ */
/* ══════════════════════════════════
   REPUTATION & BADGES SYSTEM
══════════════════════════════════ */

function calcReputationScore(stats){
  // Score out of 100: reviews (40pts), projects (30pts), win rate (20pts), reviews quality (10pts)
  const reviewScore = Math.min(stats.reviews * 4, 40);
  const projectScore = Math.min(stats.projectsWon * 6, 30);
  const winScore = stats.totalBids > 0 ? Math.round((stats.projectsWon / stats.totalBids) * 20) : 0;
  const qualityScore = stats.avgRating >= 4.8 ? 10 : stats.avgRating >= 4.5 ? 7 : stats.avgRating >= 4.0 ? 4 : 0;
  return Math.min(reviewScore + projectScore + winScore + qualityScore, 100);
}

function getVendorBadges(stats, vendor){
  const badges = [];
  if (vendor?.verified) badges.push({label:"Faith Verified", color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"Values reviewed by our team"});
  if (stats.projectsWon >= 1)  badges.push({label:"First Win",       color:"var(--success)", bg:"var(--success-bg)", desc:"First project won"});
  if (stats.projectsWon >= 5)  badges.push({label:"5 Projects",      color:"var(--info)",    bg:"var(--info-bg)",    desc:"5 projects completed"});
  if (stats.projectsWon >= 10) badges.push({label:"10 Projects",     color:"var(--info)",    bg:"var(--info-bg)",    desc:"10 projects completed"});
  if (stats.projectsWon >= 25) badges.push({label:"25 Projects",     color:"#A855F7",        bg:"#F3E8FF",           desc:"25 projects completed"});
  if (stats.reviews >= 5 && stats.avgRating >= 4.8) badges.push({label:"Top Rated",  color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"4.8+ rating with 5+ reviews"});
  if (stats.reviews >= 10) badges.push({label:"10 Reviews",     color:"var(--success)", bg:"var(--success-bg)", desc:"10 verified reviews"});
  if (stats.reviews >= 25) badges.push({label:"25 Reviews",     color:"var(--success)", bg:"var(--success-bg)", desc:"25 verified reviews"});
  if (stats.totalBids > 0 && (stats.projectsWon / stats.totalBids) >= 0.5 && stats.projectsWon >= 5)
    badges.push({label:"High Win Rate", color:"var(--warn)", bg:"var(--warn-bg)", desc:"50%+ bid win rate"});
  if (vendor?.tier === "Pro") badges.push({label:"Pro Member", color:"#A855F7", bg:"#F3E8FF", desc:"KingdomBid Pro"});
  // Check join date for anniversary
  if (vendor?.created_at){
    const months = (Date.now() - new Date(vendor.created_at)) / (1000*60*60*24*30);
    if (months >= 12) badges.push({label:"1 Year", color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"1 year on KingdomBid"});
    if (months >= 24) badges.push({label:"2 Years", color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"2 years on KingdomBid"});
  }
  return badges;
}

function getChurchBadges(stats, profile){
  const badges = [];
  if (stats.projects >= 1)  badges.push({label:"First Project",  color:"var(--success)", bg:"var(--success-bg)", desc:"First project posted"});
  if (stats.projects >= 5)  badges.push({label:"5 Projects",     color:"var(--info)",    bg:"var(--info-bg)",    desc:"5 projects posted"});
  if (stats.projects >= 10) badges.push({label:"10 Projects",    color:"var(--info)",    bg:"var(--info-bg)",    desc:"10 projects posted"});
  if (stats.projects >= 25) badges.push({label:"Community Builder", color:"#A855F7", bg:"#F3E8FF", desc:"25 projects posted"});
  if (stats.reviews >= 3)   badges.push({label:"Reviewing",      color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"Leaves vendor reviews"});
  if (stats.hired >= 1)     badges.push({label:"First Hire",     color:"var(--success)", bg:"var(--success-bg)", desc:"First vendor hired"});
  if (stats.hired >= 10)    badges.push({label:"Trusted Employer",color:"var(--success)", bg:"var(--success-bg)", desc:"Hired 10+ vendors"});
  if (profile?.created_at){
    const months = (Date.now() - new Date(profile.created_at)) / (1000*60*60*24*30);
    if (months >= 12) badges.push({label:"1 Year", color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"1 year on KingdomBid"});
    if (months >= 24) badges.push({label:"2 Years", color:"var(--gold-text)", bg:"var(--gold-pale)", desc:"2 years on KingdomBid"});
  }
  return badges;
}

function BadgeChip({badge}){
  return (
    <div title={badge.desc} style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:"4px 10px",borderRadius:100,
      background:badge.bg,border:`1px solid ${badge.color}22`,
      fontSize:10,fontWeight:700,color:badge.color,
      letterSpacing:0.3,cursor:"default",
    }}>
      {badge.label}
    </div>
  );
}

function SeasonalAlert({role, nav}){
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      const d = localStorage.getItem("seasonal_dismissed");
      if (!d) return false;
      return (Date.now() - Number(d)) < 7 * 24 * 60 * 60 * 1000; // 7 day TTL
    } catch { return false; }
  });
  const dismiss = () => {
    try { localStorage.setItem("seasonal_dismissed", Date.now()); } catch {}
    setDismissed(true);
  };
  const now = new Date();
  const month = now.getMonth(); // 0=Jan
  const alerts = [
    {months:[0,1],  church:"Winter missions season is here — need a videographer or photographer?", vendor:"Churches are planning winter missions. Update your profile now."},
    {months:[1,2],  church:"Easter is 6 weeks away. 47 churches nearby haven't hired their AV vendor yet.", vendor:"Easter season is coming — the highest-demand period of the year for AV and creative vendors."},
    {months:[3,4],  church:"Spring renovation season — perfect time to post a construction or facilities project.", vendor:"Spring construction season is starting. Churches are planning facility upgrades."},
    {months:[5,6],  church:"Summer camp and VBS season — graphic designers and event vendors are in high demand.", vendor:"Summer camps and VBS programs need your skills. Post your availability."},
    {months:[7,8],  church:"Back to ministry season — churches are staffing up for fall programs.", vendor:"Fall ministry season is peak hiring time. Make sure your profile is complete."},
    {months:[9,10], church:"End-of-year giving campaigns need creative and marketing support.", vendor:"Q4 is the biggest church spending period. Bid competitively this season."},
    {months:[11],   church:"Year-end budget season — now is the time to plan and post projects for January.", vendor:"Churches are planning next year's budgets. Get your bids in early."},
  ];
  const alert = alerts.find(a => a.months.includes(month));
  if (!alert || dismissed) return null;
  return (
    <div style={{
      background:"linear-gradient(135deg,var(--navy),var(--navy-light))",
      borderRadius:12,padding:"14px 18px",marginBottom:20,
      display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
      border:"1px solid rgba(245,240,232,0.12)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"var(--gold-light)",flexShrink:0,boxShadow:"0 0 6px var(--gold-light)"}}/>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",fontWeight:400,lineHeight:1.5}}>{role==="church"?alert.church:alert.vendor}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <button onClick={()=>nav(role==="church"?"projects":"projects")} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,color:"white",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"DM Sans,sans-serif"}}>
          {role==="church"?"Post a Project":"Browse Projects"}
        </button>
        <button onClick={dismiss} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.3)",fontSize:16,lineHeight:1,padding:"4px",fontFamily:"DM Sans,sans-serif"}} title="Dismiss">×</button>
      </div>
    </div>
  );
}


function ProfileScreen({role, currentUser, userProfile, setUserProfile, showToast, nav, initialTab}){
  const [tab, setTab] = useState(initialTab || "profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [vendorRow, setVendorRow] = useState(null);
  const [overviewStats, setOverviewStats] = useState({projects:0, hired:0, messages:0, reviews:0, bids:0});
  const [form, setForm] = useState({
    org_name:"", city:"", denomination:"", category:"", faith_statement:"",
  });
  const [vendorForm, setVendorForm] = useState({
    name:"", category:"", city:"", bio:"", faith_statement:"", tags:[],
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const setV = (k,v) => setVendorForm(f=>({...f,[k]:v}));
  const addTag = (e) => {
    if((e.key==="Enter"||e.key===",")&&tagInput.trim()){
      e.preventDefault();
      const t = tagInput.trim();
      if(!vendorForm.tags.includes(t)) setV("tags",[...vendorForm.tags,t]);
      setTagInput("");
    }
  };
  const removeTag = (t) => setV("tags", vendorForm.tags.filter(x=>x!==t));

  useEffect(() => {
    if (!currentUser) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (profile) {
        setFullProfile(profile);
        setForm({
          org_name: profile.org_name || "",
          city: profile.city || "",
          denomination: profile.denomination || "",
          category: profile.category || "",
          faith_statement: profile.faith_statement || "",
        });
      }
      // Always try to fetch vendor row — role state can be stale
      const { data: vendor } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (vendor) {
        setVendorRow(vendor);
        setVendorForm({
          name: vendor.name || "",
          category: vendor.category || "",
          city: vendor.city || "",
          bio: vendor.bio || "",
          faith_statement: vendor.faith_statement || "",
          tags: vendor.tags || [],
        });
      }
      // Fetch overview stats for church users
      if (!vendor) {
        const [projRes, hiredRes, convRes, reviewRes] = await Promise.all([
          supabase.from("projects").select("id", {count:"exact"}).eq("church_id", currentUser.id),
          supabase.from("bids").select("id", {count:"exact"}).eq("church_id", currentUser.id).eq("status","hired"),
          supabase.from("conversations").select("id", {count:"exact"}).eq("church_id", currentUser.id),
          supabase.from("reviews").select("id", {count:"exact"}).eq("church_id", currentUser.id),
        ]);
        setOverviewStats({
          projects: projRes.count || 0,
          hired: hiredRes.count || 0,
          messages: convRes.count || 0,
          reviews: reviewRes.count || 0,
          bids: 0,
        });
      } else {
        // Vendor: fetch bid count
        const { count } = await supabase.from("bids").select("id", {count:"exact"}).eq("vendor_id", currentUser.id);
        setOverviewStats(s => ({...s, bids: count || 0}));
      }
      setLoading(false);
    };
    fetchAll();
  }, [currentUser]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        org_name: form.org_name,
        city: form.city,
        denomination: role === "church" ? form.denomination : "",
        category: role === "vendor" ? form.category : "",
        faith_statement: form.faith_statement,
      })
      .eq("id", currentUser.id);
    if (!error) {
      // Also sync city to vendors table if vendor
      if (vendorRow) {
        await supabase.from("vendors").update({ city: form.city }).eq("user_id", currentUser.id);
      }
      setUserProfile(p => ({...p, org_name: form.org_name}));
      showToast("Profile saved");
    } else {
      showToast("Error saving: " + error.message);
    }
    setSaving(false);
  };

  const saveVendorProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("vendors")
      .update(vendorForm)
      .eq("user_id", currentUser.id);
    if (!error) {
      // Sync name and city back to profiles for consistency
      await supabase.from("profiles").update({ org_name: vendorForm.name, city: vendorForm.city }).eq("id", currentUser.id);
      setVendorRow(v => v ? {...v, ...vendorForm} : v);
      setUserProfile(p => ({...p, org_name: vendorForm.name}));
      showToast("Vendor profile saved");
    } else {
      showToast("Error saving: " + error.message);
    }
    setSaving(false);
  };

  const isVerified = vendorRow?.verified;
  const isPending = vendorRow?.verification_status === "pending" && !isVerified;
  const initials = (userProfile?.org_name || form.org_name || "?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)"}}>
      <div className="screen-header">
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <button onClick={()=>nav("projects")} className="btn-back-light">← Back</button>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:0}}>
            <div style={{width:42,height:42,borderRadius:10,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"var(--gold-light)",flexShrink:0,letterSpacing:0.5}}>{initials}</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <div className="screen-header-title">{userProfile?.org_name || form.org_name || "Your Account"}</div>
                {isVerified && <span style={{padding:"2px 8px",borderRadius:100,background:"rgba(22,163,74,0.15)",border:"1px solid rgba(22,163,74,0.25)",fontSize:9,fontWeight:700,color:"rgba(34,197,94,0.9)",letterSpacing:0.5}}>FAITH VERIFIED</span>}
                {isPending && <span style={{padding:"2px 8px",borderRadius:100,background:"rgba(217,119,6,0.15)",border:"1px solid rgba(217,119,6,0.25)",fontSize:9,fontWeight:700,color:"rgba(245,158,11,0.9)",letterSpacing:0.5}}>PENDING REVIEW</span>}
              </div>
              <div className="screen-header-sub">{vendorRow ? "Service Provider" : "Church / Ministry"}{form.city ? ` · ${form.city}` : ""}</div>
            </div>
          </div>
          {/* Tab bar */}
          <div className="screen-header-tabs">
            {(vendorRow
              ? [{id:"overview",label:"Overview"},{id:"vendor",label:"Public Profile"},{id:"verify",label:"Verification"},{id:"account",label:"Account"},{id:"stats",label:"Stats"}]
              : [{id:"overview",label:"Overview"},{id:"account",label:"Account"},{id:"verify",label:"Verification"},{id:"roster",label:"Trusted Vendors"},{id:"stats",label:"Stats"}]
            ).map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} className={`screen-header-tab${tab===t.id?" active":""}`} style={{position:"relative"}}>
                {t.label}
                {t.id==="verify"&&!isVerified&&!isPending&&<span style={{position:"absolute",top:8,right:6,width:5,height:5,borderRadius:"50%",background:"var(--amber)"}}/>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 28px 48px"}}>
        {loading ? <div style={{textAlign:"center",padding:"60px",color:"var(--text-muted)"}}>Loading...</div> : (
          <>
            {/* OVERVIEW */}
            {tab==="overview" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                {/* Profile completeness widget — full width at top */}
                {(() => {
                  const checks = vendorRow ? [
                    {label:"Business name",    done:!!vendorForm.name,           action:()=>setTab("profile")},
                    {label:"City & state",     done:!!vendorForm.city,           action:()=>setTab("profile")},
                    {label:"Service category", done:!!vendorForm.category,       action:()=>setTab("profile")},
                    {label:"Bio written",      done:vendorForm.bio?.length>30,   action:()=>setTab("profile")},
                    {label:"Faith statement",  done:!!vendorForm.faith_statement, action:()=>setTab("profile")},
                    {label:"Faith Verified",   done:isVerified,                  action:()=>setTab("verify")},
                  ] : [
                    {label:"Church name",      done:!!form.org_name,             action:()=>setTab("profile")},
                    {label:"City & state",     done:!!form.city,                 action:()=>setTab("profile")},
                    {label:"Denomination",     done:!!form.denomination,         action:()=>setTab("profile")},
                    {label:"Faith statement",  done:!!form.faith_statement,      action:()=>setTab("profile")},
                  ];
                  const pct = Math.round(checks.filter(c=>c.done).length / checks.length * 100);
                  const next = checks.find(c=>!c.done);
                  if (pct === 100) return null;
                  return (
                    <div style={{gridColumn:"1 / -1",background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:14,padding:"18px 20px",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:200}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                            <div style={{fontSize:13,fontWeight:700,color:"white"}}>{pct}% profile complete</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>· {checks.filter(c=>!c.done).length} step{checks.filter(c=>!c.done).length!==1?"s":""} remaining</div>
                          </div>
                          <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden",marginBottom:8}}>
                            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,var(--gold),var(--gold-light))",borderRadius:2,transition:"width 0.6s ease"}}/>
                          </div>
                          {next && <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Next: <strong style={{color:"var(--gold-light)"}}>{next.label}</strong></div>}
                        </div>
                        {next && <button onClick={next.action} style={{padding:"8px 18px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",flexShrink:0}}>Complete Profile</button>}
                      </div>
                    </div>
                  );
                })()}
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {/* Verification card */}
                  {vendorRow && (
                    <div style={{background:"white",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden"}}>
                      <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--text-muted)"}}>Verification</div>
                        <button onClick={()=>setTab("verify")} style={{fontSize:11,color:"var(--gold-text)",fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Manage →</button>
                      </div>
                      <div style={{padding:"18px"}}>
                        {isVerified ? (
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:40,height:40,borderRadius:10,background:"var(--success-bg)",border:"1px solid var(--success-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div><div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>Faith Verified</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Badge live on your public profile</div></div>
                          </div>
                        ) : isPending ? (
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:40,height:40,borderRadius:10,background:"var(--warn-bg)",border:"1px solid var(--warn-border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
                            <div><div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>Under Review</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>We'll notify you within 48 hours</div></div>
                          </div>
                        ) : (
                          <div>
                            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12,lineHeight:1.5}}>Get your Faith Verified badge to build trust with churches.</div>
                            <button onClick={()=>setTab("verify")} className="btn-primary" style={{padding:"7px 16px",fontSize:11}}>Apply Now</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Profile info */}
                  <div style={{background:"white",borderRadius:14,border:"1px solid var(--border)",padding:"18px"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>Profile Info</div>
                    {[
                      {label:"Organization", val:form.org_name||"—"},
                      {label:"Location", val:form.city||"—"},
                      {label:vendorRow?"Category":"Denomination", val:(vendorRow?vendorForm.category:form.denomination)||"—"},
                      {label:"Member since", val:fullProfile?.created_at?new Date(fullProfile.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"}):"—"},
                    ].map((item,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?"1px solid var(--border)":"none",gap:12}}>
                        <span style={{fontSize:12,color:"var(--text-muted)"}}>{item.label}</span>
                        <span style={{fontSize:12,fontWeight:600,color:"var(--navy)",textAlign:"right"}}>{item.val}</span>
                      </div>
                    ))}
                    <button onClick={()=>setTab("account")} style={{marginTop:12,width:"100%",padding:"7px",background:"var(--cream)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,color:"var(--text-mid)",fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Edit Settings</button>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{background:"white",borderRadius:14,border:"1px solid var(--border)",padding:"18px"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>Activity</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {(vendorRow
                        ? [
                            {label:"Projects Won",   val: vendorRow.projects_count ?? 0},
                            {label:"Bids Submitted",  val: overviewStats.bids},
                            {label:"Avg Rating",      val: vendorRow.rating ? Number(vendorRow.rating).toFixed(1)+"★" : "—"},
                            {label:"Reviews",         val: vendorRow.reviews_count ?? 0},
                          ]
                        : [
                            {label:"Projects Posted", val: overviewStats.projects},
                            {label:"Vendors Hired",   val: overviewStats.hired},
                            {label:"Messages",        val: overviewStats.messages},
                            {label:"Reviews Left",    val: overviewStats.reviews},
                          ]
                      ).map((s,i)=>(
                        <div key={i} style={{padding:"11px 12px",background:"var(--cream)",borderRadius:9,textAlign:"center"}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:2}}>{s.val}</div>
                          <div style={{fontSize:9,color:"var(--text-muted)",fontWeight:600,letterSpacing:0.3,textTransform:"uppercase"}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>setTab("stats")} style={{marginTop:12,width:"100%",padding:"7px",background:"var(--cream)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,color:"var(--text-mid)",fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>View Full Stats →</button>
                  </div>
                  {(vendorForm.faith_statement||form.faith_statement) && (
                    <div style={{background:"var(--navy)",borderRadius:14,padding:"18px"}}>
                      <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:8}}>Faith Statement</div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",fontStyle:"italic",lineHeight:1.75,fontWeight:300}}>"{(vendorForm.faith_statement||form.faith_statement).slice(0,180)}{(vendorForm.faith_statement||form.faith_statement).length>180?"...":""}"</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {tab==="account" && (
              <div style={{maxWidth:560}}>
                <div style={{marginBottom:22}}><div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"var(--navy)",marginBottom:3}}>Account Settings</div><div style={{fontSize:12,color:"var(--text-muted)"}}>Your login and profile information.</div></div>
                <div className="card">
                  <div className="card-hd"><div className="card-hd-title">{vendorRow?"Business":"Church"} Information</div></div>
                  <div className="card-body">
                    <div className="field"><label>{vendorRow?"Business Name":"Church / Ministry Name"}</label><input value={form.org_name} onChange={e=>set("org_name",e.target.value)} placeholder={vendorRow?"Your business name":"Grace Fellowship Church"}/></div>
                    <div className="field"><label>City, State</label><input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Dallas, TX"/></div>
                    <div className="field">
                      <label>{vendorRow?"Service Category":"Denomination"}</label>
                      {vendorRow?(<select value={form.category} onChange={e=>set("category",e.target.value)}><option value="">Select...</option>{CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select>):(<input value={form.denomination} onChange={e=>set("denomination",e.target.value)} placeholder="e.g. Non-denominational"/>)}
                    </div>
                    <div className="field"><label>Faith Statement</label><textarea rows={3} value={form.faith_statement} onChange={e=>set("faith_statement",e.target.value)} placeholder="How does your faith shape your work or ministry?"/></div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}><button className="btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving...":"Save Changes"}</button><button className="btn-secondary" onClick={()=>nav("settings")}>Password & Security</button></div>
              </div>
            )}

            {/* VENDOR PUBLIC PROFILE */}
            {tab==="vendor" && (
              <div style={{maxWidth:600}}>
                <div style={{marginBottom:22}}><div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"var(--navy)",marginBottom:3}}>Public Vendor Profile</div><div style={{fontSize:12,color:"var(--text-muted)"}}>What churches see in the directory.</div></div>
                {isVerified && <div style={{background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--success)",fontWeight:600,display:"flex",alignItems:"center",gap:8}}><svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Faith Verified badge is live on this profile</div>}
                {!isVerified && !isPending && <div onClick={()=>setTab("verify")} style={{background:"linear-gradient(135deg,#1a2914,#0f1a0c)",borderRadius:11,padding:"16px 20px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:"1px solid rgba(232,224,208,0.1)"}}><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:2}}>Get Faith Verified</div><div style={{fontSize:11,color:"rgba(255,255,255,0.38)"}}>Adds a trust badge. Takes 3 minutes.</div></div><div style={{padding:"7px 14px",background:"linear-gradient(135deg,var(--gold),var(--gold-light))",color:"var(--navy)",borderRadius:7,fontSize:11,fontWeight:700}}>Apply</div></div>}
                <div className="card">
                  <div className="card-hd"><div className="card-hd-title">Directory Listing</div></div>
                  <div className="card-body">
                    <div className="field"><label>Display Name</label><input value={vendorForm.name} onChange={e=>setV("name",e.target.value)} placeholder="Your business display name"/></div>
                    <div className="field"><label>Service Category</label><select value={vendorForm.category} onChange={e=>setV("category",e.target.value)}><option value="">Select...</option>{CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}</select></div>
                    <div className="field"><label>City, State</label><input value={vendorForm.city} onChange={e=>setV("city",e.target.value)} placeholder="Dallas, TX"/></div>
                    <div className="field"><label>Bio <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>— public profile</span></label><textarea rows={4} value={vendorForm.bio} onChange={e=>setV("bio",e.target.value)} placeholder="Describe your services and how you serve ministries..."/><div className="char-count">{vendorForm.bio.length}/300</div></div>
                    <div className="field"><label>Faith Statement <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>— public</span></label><textarea rows={3} value={vendorForm.faith_statement} onChange={e=>setV("faith_statement",e.target.value)} placeholder="How does your faith shape your work?"/></div>
                    <div className="field"><label>Skills / Tags <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>— press Enter to add</span></label>
                      <div className="tags-wrap">
                        {(vendorForm.tags||[]).map(t=><div key={t} className="tag-chip">{t}<button className="tag-chip-x" onClick={()=>removeTag(t)}>×</button></div>)}
                        <input className="tags-input" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} placeholder={(vendorForm.tags||[]).length?"":"e.g. Audio Engineering, Live Sound…"}/>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}><button className="btn-primary" onClick={saveVendorProfile} disabled={saving}>{saving?"Saving...":"Save Profile"}</button><button className="btn-secondary" onClick={()=>nav("vendors")}>View in Directory</button></div>
              </div>
            )}

            {/* VERIFICATION */}
            {tab==="verify" && (
              <div>
                <div style={{marginBottom:28,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Faith Verification</div>
                    <div style={{fontSize:13,color:"var(--text-muted)"}}>Build trust with churches. Takes about 3 minutes.</div>
                  </div>
                  {isVerified && <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 18px",borderRadius:100,background:"var(--success-bg)",border:"1px solid var(--success-border)",flexShrink:0}}><svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{fontSize:12,fontWeight:700,color:"var(--success)"}}>Faith Verified</span></div>}
                </div>
                <VendorVerificationFlow currentUser={currentUser} vendorRow={vendorRow} showToast={showToast} onVerified={()=>{setVendorRow(v=>v?{...v,verification_status:"pending"}:v);showToast("Application submitted — we'll review within 48 hours");}}/>
              </div>
            )}

            {/* TRUSTED VENDORS */}
            {tab==="roster" && <TrustedVendorRoster currentUser={currentUser} nav={nav}/>}

            {/* STATS */}
            {tab==="stats" && <ProfileStats currentUser={currentUser} role={vendorRow?"vendor":role} showToast={showToast}/>}
          </>
        )}
      </div>
    </div>
  );
}

function ProfileStats({currentUser, role, showToast}){
  const [stats, setStats] = useState({projects:0, bids:0, reviews:0, conversations:0, hired:0, projectsWon:0, totalBids:0, avgRating:0, earnings:0});
  const [badges, setBadges] = useState([]);
  const [vendorRow, setVendorRow] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("stats"); // "stats" | "availability" | "referrals" | "legal"

  useEffect(() => {
    if (!currentUser) return;
    const fetch = async () => {
      setLoading(true);
      if (role === "church") {
        const [projRes, convRes, hiredRes, reviewRes, profileRes] = await Promise.all([
          supabase.from("projects").select("id", {count:"exact"}).eq("church_id", currentUser.id),
          supabase.from("conversations").select("id", {count:"exact"}).eq("church_id", currentUser.id),
          supabase.from("bids").select("id", {count:"exact"}).eq("church_id", currentUser.id).eq("status","hired"),
          supabase.from("reviews").select("id", {count:"exact"}).eq("church_id", currentUser.id),
          supabase.from("profiles").select("created_at").eq("id", currentUser.id).maybeSingle(),
        ]);
        const s = {
          projects: projRes.count||0, conversations: convRes.count||0,
          hired: hiredRes.count||0, reviews: reviewRes.count||0,
          bids:0, projectsWon:0, totalBids:0, avgRating:0, earnings:0,
        };
        setStats(s);
        setProfile(profileRes.data);
        setBadges(getChurchBadges(s, profileRes.data));
      } else {
        const [bidRes, wonRes, reviewRes, convRes, vendorRes] = await Promise.all([
          supabase.from("bids").select("id,amount", {count:"exact"}).eq("vendor_id", currentUser.id),
          supabase.from("bids").select("id,amount").eq("vendor_id", currentUser.id).eq("status","hired"),
          supabase.from("reviews").select("rating").eq("vendor_id", currentUser.id),
          supabase.from("conversations").select("id", {count:"exact"}).eq("vendor_id", currentUser.id),
          supabase.from("vendors").select("*").eq("user_id", currentUser.id).maybeSingle(),
        ]);
        const won = wonRes.data || [];
        const reviews = reviewRes.data || [];
        const earnings = won.reduce((sum,b)=>sum+(Number(b.amount)||0),0);
        const avgRating = reviews.length ? reviews.reduce((a,r)=>a+(r.rating||5),0)/reviews.length : 0;
        const s = {
          bids: bidRes.count||0, projectsWon: won.length, totalBids: bidRes.count||0,
          reviews: reviews.length, conversations: convRes.count||0,
          avgRating, earnings, projects:0, hired:0,
        };
        setStats(s);
        setVendorRow(vendorRes.data);
        setBadges(getVendorBadges(s, vendorRes.data));
      }
      setLoading(false);
    };
    fetch();
  }, [currentUser, role]);

  if (loading) return <div style={{textAlign:"center",padding:"30px",color:"var(--text-muted)"}}>Loading...</div>;

  const repScore = role==="vendor" ? calcReputationScore(stats) : null;

  const SUBTABS = [
    {id:"stats", label:"Stats"},
    ...(role==="vendor" ? [{id:"availability", label:"Availability"}] : []),
    {id:"referrals", label:"Referrals"},
    {id:"legal", label:"Legal"},
  ];

  return (
    <div>
      {/* Sub-tab nav */}
      <div style={{display:"flex",gap:6,marginBottom:22,flexWrap:"wrap"}}>
        {SUBTABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} className={`filter-pill${subTab===t.id?" active":""}`}>{t.label}</button>
        ))}
      </div>

      {subTab === "availability" && role === "vendor" && (
        <div style={{maxWidth:520}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Your Public Availability</div>
            <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.6}}>Let churches know when you're open for new projects. Click any future date to toggle availability. Churches can see this on your profile.</div>
          </div>
          <AvailabilityCalendar vendorId={vendorRow?.id} editable={true} showToast={showToast}/>
        </div>
      )}

      {subTab === "referrals" && (
        <ReferralPanel currentUser={currentUser} showToast={showToast}/>
      )}

      {subTab === "legal" && (
        <LegalProtectionPanel role={role} showToast={showToast}/>
      )}

      {subTab === "stats" && (
      <div>
      {/* Seasonal alert */}
      <SeasonalAlert role={role} nav={()=>{}}/>

      {/* KPI row */}
      <div style={{display:"flex",gap:0,background:"white",border:"1px solid rgba(42,53,32,0.09)",borderRadius:12,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
        {(role==="church" ? [
          {label:"Projects Posted",   val:stats.projects},
          {label:"Vendors Hired",     val:stats.hired},
          {label:"Conversations",     val:stats.conversations},
          {label:"Reviews Left",      val:stats.reviews},
        ] : [
          {label:"Bids Submitted",   val:stats.bids},
          {label:"Projects Won",     val:stats.projectsWon},
          {label:"Win Rate",         val:stats.totalBids>0?Math.round(stats.projectsWon/stats.totalBids*100)+"%":"—"},
          {label:"Avg Rating",       val:stats.avgRating>0?stats.avgRating.toFixed(1)+"★":"—"},
        ]).map((s,i)=>(
          <div key={i} style={{flex:1,padding:"16px",textAlign:"center",borderRight:i<3?"1px solid var(--border)":"none"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:"var(--navy)",lineHeight:1,marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:10,color:"var(--text-muted)",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Vendor-only: Reputation score + earnings */}
      {role==="vendor" && (
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          {/* Reputation score */}
          <div style={{flex:1,minWidth:200,background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"20px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>Reputation Score</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,marginBottom:12}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,color:"var(--navy)",lineHeight:1}}>{repScore}</div>
              <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:4}}>/100</div>
            </div>
            <div style={{height:6,background:"var(--cream-dark)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${repScore}%`,background:`linear-gradient(90deg,var(--gold),var(--gold-light))`,borderRadius:3,transition:"width 1s ease"}}/>
            </div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:8}}>
              {repScore>=80?"Elite vendor — top 10% of the platform":repScore>=60?"Strong reputation — keep growing":repScore>=40?"Building momentum — stay consistent":"Just getting started — win your first project"}
            </div>
          </div>
          {/* Earnings summary */}
          <div style={{flex:1,minWidth:200,background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"20px"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>Revenue via KingdomBid</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)",lineHeight:1,marginBottom:6}}>
              ${stats.earnings.toLocaleString()}
            </div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12}}>Across {stats.projectsWon} completed project{stats.projectsWon!==1?"s":""}</div>
            <div style={{padding:"8px 12px",background:"var(--success-bg)",borderRadius:7,fontSize:11,color:"var(--success)",fontWeight:600}}>
              Your earnings on KingdomBid are growing
            </div>
          </div>
        </div>
      )}

      {/* Church-only: Ministry Report teaser */}
      {role==="church" && stats.projects >= 1 && (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:12,padding:"18px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"white",marginBottom:3}}>Your Annual Ministry Report is ready</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>Show your congregation how your ministry invested in professional services this year.</div>
          </div>
          <button style={{background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:7,padding:"8px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>
            View Report
          </button>
        </div>
      )}

      {/* Early access banner for Pro vendors */}
      {role==="vendor" && vendorRow?.tier==="Pro" && (
        <div style={{background:"linear-gradient(135deg,#3B0764,#6B21A8)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#D8B4FE",flexShrink:0,boxShadow:"0 0 8px #D8B4FE"}}/>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>
            <strong>Pro member perk:</strong> You see new projects 24 hours before free vendors. Check the Projects tab for early access listings.
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div style={{background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"18px 20px",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:14}}>Your Badges</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {badges.map((b,i)=><BadgeChip key={i} badge={b}/>)}
          </div>
        </div>
      )}

      {/* Next milestone */}
      <div style={{background:"var(--cream)",borderRadius:12,border:"1px solid var(--border)",padding:"16px 20px"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>Next Milestone</div>
        {role==="vendor" ? (
          <div style={{fontSize:13,color:"var(--text-mid)"}}>
            {stats.projectsWon===0 && "Win your first project to unlock the First Win badge and start building your reputation score."}
            {stats.projectsWon>=1 && stats.projectsWon<5 && `Win ${5-stats.projectsWon} more project${5-stats.projectsWon!==1?"s":""} to unlock the 5 Projects badge.`}
            {stats.projectsWon>=5 && stats.projectsWon<10 && `Win ${10-stats.projectsWon} more project${10-stats.projectsWon!==1?"s":""} to unlock the 10 Projects badge.`}
            {stats.projectsWon>=10 && stats.projectsWon<25 && `Win ${25-stats.projectsWon} more projects to reach Community Builder status.`}
            {stats.projectsWon>=25 && "You've reached the top tier. Elite status unlocked."}
          </div>
        ) : (
          <div style={{fontSize:13,color:"var(--text-mid)"}}>
            {stats.projects===0 && "Post your first project to get started and unlock the First Project badge."}
            {stats.projects>=1 && stats.projects<5 && `Post ${5-stats.projects} more project${5-stats.projects!==1?"s":""} to unlock the 5 Projects badge.`}
            {stats.projects>=5 && stats.projects<10 && `Post ${10-stats.projects} more project${10-stats.projects!==1?"s":""} to unlock the 10 Projects badge.`}
            {stats.projects>=10 && stats.projects<25 && `Post ${25-stats.projects} more projects to become a Community Builder.`}
            {stats.projects>=25 && "You're a cornerstone of this community. Thank you."}
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   TRUSTED VENDOR ROSTER (church profile tab)
══════════════════════════════════ */
function TrustedVendorRoster({currentUser, nav}){
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    // Fetch vendors the church has hired (from completed bids)
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bids")
        .select("vendor_id, vendor_name, category, amount, created_at, projects(title)")
        .eq("status", "hired")
        .eq("church_id", currentUser.id)
        .order("created_at", {ascending:false})
        .limit(20);
      if (data) {
        // Deduplicate by vendor_id
        const seen = new Set();
        const unique = data.filter(b => { if(seen.has(b.vendor_id)) return false; seen.add(b.vendor_id); return true; });
        setRoster(unique);
      }
      setLoading(false);
    };
    fetch();
  }, [currentUser]);

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Your Vendor Roster</div>
        <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6}}>
          Every vendor your church has hired through KingdomBid. Your roster grows with every project — and stays here for your reference even after a project closes.
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"32px",color:"var(--text-muted)",fontSize:13}}>Loading roster...</div>
      ) : roster.length === 0 ? (
        <div style={{background:"var(--cream)",borderRadius:12,border:"1px solid var(--border)",padding:"32px",textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:6}}>Your roster is empty</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:16}}>Hire your first vendor and they'll appear here for future reference.</div>
          <button className="btn-primary" onClick={()=>nav("vendors")}>Browse Vendors</button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {roster.map((b,i) => (
            <div key={i} style={{background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:10,background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--gold-light)",flexShrink:0}}>
                  {(b.vendor_name||"V")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>{b.vendor_name}</div>
                  <div style={{fontSize:11,color:"var(--text-muted)"}}>{b.category || "Service Provider"} · Hired for: {b.projects?.title || "Project"}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:"var(--text-muted)"}}>${Number(b.amount).toLocaleString()}</span>
                <button onClick={()=>nav("vendors")} style={{background:"var(--cream-dark)",border:"1px solid var(--border)",borderRadius:6,padding:"5px 11px",fontSize:11,fontWeight:600,color:"var(--text-mid)",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}} title={`Find ${b.vendor_name} in the Vendor Directory`}>View in Directory →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Referral section */}
      <div style={{marginTop:20,background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:12,padding:"18px 20px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"white",marginBottom:4}}>Refer a church, earn a featured listing</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:12}}>When a church you refer hires their first vendor, you unlock a featured placement in our directory.</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,padding:"7px 12px",fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"DM Mono,monospace"}}>
            kingdombid.com/ref/{currentUser?.id?.slice(0,8)||"xxxxxxxx"}
          </div>
          <button onClick={async()=>{
            const link = `https://kingdombid.com/join?ref=${currentUser?.id?.slice(0,8)||""}`;
            try { await navigator.clipboard.writeText(link); showToast("✓ Referral link copied"); }
            catch { showToast("Copy failed — copy the link manually"); }
          }} style={{background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:7,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}}>Copy Link</button>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════
   SETTINGS SCREEN
══════════════════════════════════ */
function SettingsScreen({currentUser, showToast, nav, onSignOut}){
  const [tab, setTab] = useState("account");
  const [email, setEmail] = useState(currentUser?.email || "");
  // Keep email field in sync if currentUser changes
  useEffect(() => { setEmail(currentUser?.email || ""); }, [currentUser?.email]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState({
    newBid: true, bidAccepted: true, newMessage: true, projectUpdate: false, newsletter: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // Load notification prefs from Supabase on mount
  useEffect(() => {
    if (!currentUser) return;
    supabase.from("notification_prefs").select("*").eq("user_id", currentUser.id).maybeSingle()
      .then(({ data }) => {
        if (data) setNotifs({
          newBid: data.new_bid ?? true,
          bidAccepted: data.bid_accepted ?? true,
          newMessage: data.new_message ?? true,
          projectUpdate: data.project_update ?? false,
          newsletter: data.newsletter ?? false,
        });
      });
  }, [currentUser]);

  const saveNotifs = async () => {
    setNotifSaving(true);
    const row = {
      user_id: currentUser.id,
      new_bid: notifs.newBid,
      bid_accepted: notifs.bidAccepted,
      new_message: notifs.newMessage,
      project_update: notifs.projectUpdate,
      newsletter: notifs.newsletter,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("notification_prefs").upsert(row, { onConflict: "user_id" });
    setNotifSaving(false);
    showToast("✓ Notification preferences saved");
  };

  const updateEmail = async () => {
    if (!email || email === currentUser?.email) { showToast("No change to email"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (!error) showToast("Confirmation sent to new email — check your inbox");
    else showToast("Error: " + error.message);
    setSaving(false);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) { showToast("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { showToast("Passwords don't match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) { showToast("Password updated"); setNewPassword(""); setConfirmPassword(""); }
    else showToast("Error: " + error.message);
    setSaving(false);
  };

  const TABS = [{id:"account",label:"Account"},{id:"notifications",label:"Notifications"},{id:"legal",label:"Legal"},{id:"danger",label:"Danger Zone"}];

  return (
    <div className="page" style={{maxWidth:640}}>
      <button className="btn-back" onClick={()=>nav("projects")}>← Back</button>
      <div className="page-hd">
        <div><div className="eyebrow">Settings</div><h1 className="page-title">Account Settings</h1></div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {TABS.map(t=>(
          <button key={t.id} className={`filter-pill${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── ACCOUNT TAB ── */}
      {tab==="account" && (
        <>
          <div className="card">
            <div className="card-hd"><div className="card-hd-title">Email Address</div></div>
            <div className="card-body">
              <div className="field">
                <label>Current Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@ministry.org"/>
              </div>
              <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12}}>Changing your email will require confirmation from the new address.</div>
              <button className="btn-primary" onClick={updateEmail} disabled={saving||email===currentUser?.email} style={{opacity:email===currentUser?.email?0.5:1}}>Update Email</button>
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-hd-title">Password</div></div>
            <div className="card-body">
              <div className="field"><label>New Password</label><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="At least 6 characters"/></div>
              <div className="field"><label>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat new password"/></div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div style={{fontSize:12,color:"var(--danger)",marginBottom:12}}>Passwords don't match</div>
              )}
              <button className="btn-primary" onClick={updatePassword} disabled={saving||!newPassword||!confirmPassword}>Update Password</button>
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-hd-title">Account Info</div></div>
            <div className="card-body">
              {[
                {label:"User ID", val:currentUser?.id?.slice(0,8)+"..."},
                {label:"Email verified", val:currentUser?.email_confirmed_at ? "Verified" : "Not verified"},
                {label:"Account created", val:currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : "—"},
                {label:"Last sign in", val:currentUser?.last_sign_in_at ? new Date(currentUser.last_sign_in_at).toLocaleDateString() : "—"},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontSize:13,color:"var(--text-muted)"}}>{item.label}</span>
                  <span style={{fontSize:13,fontWeight:500,color:"var(--navy)",fontFamily:"DM Mono,monospace"}}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab==="notifications" && (
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">Email Notifications</div><span style={{fontSize:11,color:"var(--text-muted)"}}>Coming with email integration</span></div>
          <div className="card-body">
            {[
              {key:"newBid",      label:"New bid received",        sub:"When a vendor bids on your project"},
              {key:"bidAccepted", label:"Bid accepted",            sub:"When a church accepts your bid"},
              {key:"newMessage",  label:"New message",             sub:"When someone sends you a message"},
              {key:"projectUpdate",label:"Project status update",  sub:"When a project you bid on changes status"},
              {key:"newsletter",  label:"Platform newsletter",     sub:"Tips, updates, and new features"},
            ].map(item=>(
              <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:"var(--navy)"}}>{item.label}</div>
                  <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{item.sub}</div>
                </div>
                <div
                  onClick={()=>setNotifs(n=>({...n,[item.key]:!n[item.key]}))}
                  style={{width:38,height:22,borderRadius:100,background:notifs[item.key]?"var(--gold)":"var(--cream-dark)",border:"1px solid var(--border)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}
                >
                  <div style={{position:"absolute",top:2,left:notifs[item.key]?18:2,width:16,height:16,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:14,padding:"10px 12px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:9,fontSize:12,color:"var(--info)"}}>
              In-app notifications are live. Email delivery coming soon.
            </div>
            <div style={{marginTop:16}}>
              <button className="btn-primary" onClick={saveNotifs} disabled={notifSaving} style={{fontSize:12}}>
                {notifSaving ? "Saving…" : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEGAL TAB ── */}
      {tab==="legal" && (
        <LegalProtectionPanel role={currentUser ? (currentUser.user_metadata?.role || "church") : "church"} showToast={showToast}/>
      )}

      {/* ── DANGER ZONE TAB ── */}
      {tab==="danger" && (
        <>
          <div className="card" style={{border:"1px solid var(--danger-border)"}}>
            <div className="card-hd" style={{background:"var(--danger-bg)"}}><div className="card-hd-title" style={{color:"var(--danger)"}}>Danger Zone</div></div>
            <div className="card-body">
              <div style={{marginBottom:20}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:5}}>Sign Out</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:12}}>Sign out of your account on this device.</div>
                <button className="btn-secondary" onClick={onSignOut} style={{borderColor:"var(--danger)",color:"var(--danger)"}}>Sign Out</button>
              </div>
              <div style={{borderTop:"1px solid var(--border)",paddingTop:20}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:5}}>Delete Account</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:12}}>Permanently delete your account and all associated data. This cannot be undone.</div>
                <button
                  className="btn-secondary"
                  style={{borderColor:"var(--danger)",color:"var(--danger)"}}
                  onClick={()=>showToast("To delete your account, contact support@kingdombid.com")}
                >Delete Account</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   STRIPE PLATFORM FEE MODAL
══════════════════════════════════ */
function StripePlatformFeeModal({bid, project, onClose, onSuccess, showToast}){
  const feeAmount = Math.min(Math.round((bid.amount || 0) * 0.10), 200);
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    // Log the hire intent — payment will be invoiced separately
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (user) {
      await supabase.from("hire_confirmations").insert({
        church_id: user.id,
        vendor_id: bid.vendor_id || null,
        vendor_name: bid.vendor,
        project_id: project?.id || null,
        project_title: project?.title || "",
        bid_amount: bid.amount,
        platform_fee: feeAmount,
        status: "pending_payment",
        created_at: new Date().toISOString(),
      }).catch(()=>{});
    }
    setProcessing(false);
    setConfirmed(true);
    showToast("✓ Vendor hired! We'll be in touch about payment.");
    setTimeout(()=>{ onSuccess(); }, 1200);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:440,overflow:"hidden",animation:"fadeUp 0.2s ease",boxShadow:"0 24px 64px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"var(--navy)",padding:"20px 24px",position:"relative"}}>
          <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"linear-gradient(rgba(232,224,208,1) 1px,transparent 1px),linear-gradient(90deg,rgba(232,224,208,1) 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",marginBottom:6}}>Confirm Hire</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"white",marginBottom:3}}>Hire {bid.vendor}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{project?.title}</div>
          </div>
        </div>
        <div style={{padding:"20px 24px",borderBottom:"1px solid var(--border)"}}>
          {[
            {label:"Vendor bid amount", val:`$${(bid.amount||0).toLocaleString()}`},
            {label:"Platform fee (10%, max $200)", val:`$${feeAmount.toLocaleString()}`},
          ].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:13,color:"var(--text-muted)"}}>{r.label}</span>
              <span style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{r.val}</span>
            </div>
          ))}
          <div style={{height:1,background:"var(--border)",margin:"12px 0"}}/>
          <div style={{padding:"12px 14px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:9,fontSize:12,color:"var(--info)",lineHeight:1.6}}>
            Payments are currently handled by invoice. After confirming, our team will send you a payment link within 24 hours. The vendor will be notified and work can begin.
          </div>
        </div>
        <div style={{padding:"20px 24px",display:"flex",gap:10}}>
          <button
            onClick={handleConfirm}
            disabled={processing||confirmed}
            className="btn-primary"
            style={{flex:1,justifyContent:"center",opacity:(processing||confirmed)?0.6:1}}
          >
            {confirmed ? "✓ Confirmed!" : processing ? "Confirming..." : `Confirm Hire — $${feeAmount.toLocaleString()} fee`}
          </button>
          <button onClick={onClose} className="btn-secondary" disabled={processing}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LANDING
══════════════════════════════════ */
/* ══════════════════════════════════
   LANDING — FAITH VERIFIED PAGE
══════════════════════════════════ */
function LandingFaithVerified({nav}){
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setCurrentUser(data?.user||null)); },[]);
  const handleApply = () => { if(currentUser) nav("verify-profile"); else nav("auth"); };
  const COVENANT = [
    {num:"01", title:"I serve as unto the Lord.", body:"Every project I take is an act of service — not just to a church, but to the Kingdom. I bring my best work to every ministry I serve."},
    {num:"02", title:"I operate with integrity.", body:"I am honest about my pricing, my timeline, and my capabilities. I do not overpromise or underdeliver. My word is my bond."},
    {num:"03", title:"I represent my faith in how I do business.", body:"My conduct — in communication, in conflict, and in completion — reflects Christ. I treat every church as a partner, not a transaction."},
    {num:"04", title:"I am accountable to my community.", body:"I am an active member of a local church. I welcome a pastoral reference. I understand that my reputation on this platform reflects the broader body of Christ."},
    {num:"05", title:"I welcome review and accountability.", body:"I agree to KingdomBid's community standards. I understand that verified status can be reviewed or revoked if my conduct falls short of these commitments."},
  ];

  const TIERS = [
    {
      name:"Member",
      desc:"Joined KingdomBid and agreed to the Vendor Covenant.",
      steps:["Create your account","Complete your profile","Sign the Vendor Covenant"],
      badge:"Member",
      badgeColor:"rgba(255,255,255,0.5)",
      badgeBg:"rgba(255,255,255,0.06)",
    },
    {
      name:"Faith Verified",
      desc:"Reviewed by our team. Faith statement confirmed. One ministry reference on file.",
      steps:["Submit a faith statement","Provide one ministry reference","Team review within 48 hours"],
      badge:"Faith Verified",
      badgeColor:"var(--gold-light)",
      badgeBg:"rgba(232,224,208,0.12)",
      featured:true,
    },
    {
      name:"Elder Endorsed",
      desc:"Pastoral letter on file. Highest trust signal on the platform.",
      steps:["Upload a letter from your pastor","Extended profile and featured placement","Annual renewal"],
      badge:"Elder Endorsed",
      badgeColor:"#D8B4FE",
      badgeBg:"rgba(168,85,247,0.12)",
    },
  ];

  return (
    <div id="faith-verified-section" style={{background:"var(--cream)",padding:"96px 0"}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 48px"}}>

        {/* Header */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"end",marginBottom:72}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:16}}>Faith Verified</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:48,fontWeight:700,color:"var(--navy)",lineHeight:1,letterSpacing:-1,margin:0}}>
              Not just talented.<br/><span style={{color:"rgba(42,53,32,0.25)"}}>Accountable.</span>
            </h2>
          </div>
          <div style={{paddingBottom:4}}>
            <p style={{fontSize:16,color:"var(--text-muted)",fontWeight:300,lineHeight:1.8,margin:"0 0 20px 0"}}>
              Any platform can list service providers. KingdomBid verifies that vendors share your values — and holds them accountable to those values over time.
            </p>
            <button
              onClick={handleApply}
              className="btn-primary"
              style={{padding:"11px 24px",fontSize:13}}
            >{currentUser ? "Go to Verification" : "Apply for Verification"}</button>
          </div>
        </div>

        {/* What we believe */}
        <div style={{background:"var(--navy)",borderRadius:20,padding:"48px",marginBottom:48}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:12}}>What We Believe</div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:600,color:"white",lineHeight:1.6,maxWidth:680,marginBottom:0}}>
            "KingdomBid exists to serve the body of Christ — by connecting ministries with professionals who share their mission, their values, and their commitment to excellence."
          </div>
          <div style={{marginTop:20,fontSize:12,color:"rgba(255,255,255,0.3)",letterSpacing:0.3}}>Non-denominational. Kingdom-focused. Open to all who follow Christ.</div>
        </div>

        {/* Verification tiers */}
        <div style={{marginBottom:72}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:24}}>Verification Tiers</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {TIERS.map((t,i)=>(
              <div key={i} style={{background:"white",borderRadius:16,border:t.featured?"2px solid var(--gold)":"1.5px solid var(--border)",padding:"28px 24px",position:"relative",transition:"all 0.2s"}}>
                {t.featured && <div style={{position:"absolute",top:-12,left:24,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",color:"var(--navy)",fontSize:10,fontWeight:700,padding:"3px 12px",borderRadius:100,letterSpacing:0.5}}>Most Common</div>}
                {/* Badge pill */}
                <div style={{display:"inline-flex",marginBottom:16,padding:"4px 12px",borderRadius:100,background:t.badgeBg,border:`1px solid ${t.badgeColor}40`}}>
                  <span style={{fontSize:11,fontWeight:700,color:t.badgeColor,letterSpacing:0.3}}>{t.badge}</span>
                </div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{t.name}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6,marginBottom:20,fontWeight:300}}>{t.desc}</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {t.steps.map((s,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:"var(--cream-dark)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"var(--text-muted)",flexShrink:0,marginTop:1}}>{si+1}</div>
                      <span style={{fontSize:12,color:"var(--text-mid)",lineHeight:1.5}}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Vendor Covenant */}
        <div>
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:32,marginBottom:32}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:12}}>The Vendor Covenant</div>
              <h3 style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"var(--navy)",margin:0,lineHeight:1}}>Five commitments.<br/>One standard.</h3>
            </div>
            <div style={{fontSize:13,color:"var(--text-muted)",fontWeight:300,maxWidth:320,lineHeight:1.7,paddingBottom:4}}>Every vendor on KingdomBid signs this covenant at signup. It is not a legal document — it is a values commitment. And it means something.</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:0,border:"none",borderRadius:0,overflow:"visible",background:"transparent"}}>
            {COVENANT.map((c,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"72px 1fr",borderBottom:i<COVENANT.length-1?"1px solid var(--border)":"none"}}>
                <div style={{padding:"24px",borderRight:"1px solid var(--border)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:26}}>
                  <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text-muted)",letterSpacing:1}}>{c.num}</span>
                </div>
                <div style={{padding:"22px 28px"}}>
                  <div style={{fontFamily:"Playfair Display,serif",fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:6}}>{c.title}</div>
                  <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,fontWeight:300}}>{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:24,display:"flex",alignItems:"center",gap:16}}>
            <button onClick={handleApply} className="btn-primary" style={{padding:"11px 24px",fontSize:13}}>{currentUser ? "Go to Verification" : "Join as a Verified Vendor"}</button>
            <div style={{fontSize:12,color:"var(--text-muted)",fontWeight:300}}>One ministry reference required for Faith Verified status.</div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LANDING — PRICING
══════════════════════════════════ */
function LandingProblem({nav}){
  const [active, setActive] = useState(null);

  const PAINS = [
    {
      num:"01",
      title:"The right vendors are invisible.",
      body:"Churches post in Facebook groups and cross their fingers. The best designers, musicians, and contractors — the ones who actually want to serve ministry — have no dedicated place to be found.",
      counter:"Word of mouth misses 9 out of 10 qualified candidates.",
    },
    {
      num:"02",
      title:"Vetting is a full-time job.",
      body:"Portfolio, references, values alignment, pricing, availability — every hire is a research project. Multiply that by every project your church runs this year.",
      counter:"The average church spends 3+ weeks vetting a single vendor.",
    },
    {
      num:"03",
      title:"Communication lives in ten different places.",
      body:"Email threads, text messages, voicemails, DMs. Nobody has the full picture. Projects stall. Staff burn out. And nobody planned for any of this.",
      counter:"60% of ministry staff name vendor management as their biggest admin burden.",
    },
    {
      num:"04",
      title:"Talented believers can't find kingdom work.",
      body:"Hundreds of thousands of Christian professionals — videographers, contractors, accountants, creatives — want to build their career around their faith. Right now, there's nowhere to go.",
      counter:"400,000+ Christian freelancers are actively looking for ministry-aligned clients.",
    },
  ];

  return (
    <div style={{background:"#0F1A0C",position:"relative"}}>
      {/* Section header */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"96px 48px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"end",paddingBottom:64,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",marginBottom:20,opacity:0.7}}>The Problem</div>
            <div style={{fontSize:54,fontWeight:800,color:"white",lineHeight:0.95,letterSpacing:-2,fontFamily:"DM Sans,sans-serif"}}>
              Ministry deserves<br/>
              <span style={{color:"rgba(255,255,255,0.2)"}}>better tools.</span>
            </div>
          </div>
          <div style={{paddingBottom:4}}>
            <p style={{fontSize:16,color:"rgba(255,255,255,0.35)",fontWeight:300,lineHeight:1.85,margin:0}}>
              Every church faces the same friction. They know what they need — a reliable contractor, a skilled videographer, a trustworthy bookkeeper — but finding, vetting, and managing those people costs more time than the work itself.
            </p>
          </div>
        </div>
      </div>

      {/* Pain points — accordion rows, clean fixed layout */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 48px"}}>
        {PAINS.map((p,i)=>(
          <div
            key={i}
            onClick={()=>setActive(active===i?null:i)}
            style={{borderBottom:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"}}
          >
            <div style={{display:"grid",gridTemplateColumns:"48px 1fr 32px",alignItems:"start",padding:"32px 0",gap:0}}>
              {/* Number */}
              <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.15)",letterSpacing:1,paddingTop:4}}>{p.num}</div>
              {/* Content */}
              <div>
                <div style={{fontSize:20,fontWeight:700,color:"white",letterSpacing:-0.3,fontFamily:"DM Sans,sans-serif",lineHeight:1.3}}>{p.title}</div>
                {active===i && (
                  <div style={{marginTop:14,animation:"fadeUp 0.2s ease"}}>
                    <p style={{fontSize:14,color:"rgba(255,255,255,0.42)",fontWeight:300,lineHeight:1.85,margin:"0 0 14px 0"}}>{p.body}</p>
                    <div style={{display:"inline-block",padding:"6px 14px",background:"rgba(232,224,208,0.05)",border:"1px solid rgba(232,224,208,0.1)",borderRadius:4,fontSize:11,color:"rgba(232,224,208,0.55)",fontWeight:500,letterSpacing:0.2}}>{p.counter}</div>
                  </div>
                )}
              </div>
              {/* Toggle icon */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingTop:4}}>
                <div style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.25s",transform:active===i?"rotate(45deg)":"rotate(0deg)"}}>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.25)",lineHeight:1,marginTop:"-1px"}}>+</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Solution bridge */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:0}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"64px 48px",display:"grid",gridTemplateColumns:"1fr auto",gap:48,alignItems:"center"}}>
          <div>
            <div style={{fontSize:28,fontWeight:700,color:"white",letterSpacing:-0.5,marginBottom:10,fontFamily:"DM Sans,sans-serif"}}>
              KingdomBid fixes all of it.
            </div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.35)",fontWeight:300,lineHeight:1.7}}>
              One platform. Verified vendors. Transparent pricing. Built exclusively for churches — and the people who want to serve them.
            </div>
            <div style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.28)",letterSpacing:0.2}}>
              1% of every commission is donated to a ministry fund.
            </div>
          </div>
          <button
            onClick={()=>nav("auth")}
            style={{padding:"16px 32px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",letterSpacing:0.3,whiteSpace:"nowrap",transition:"all 0.2s",flexShrink:0}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
          >
            Get started free
          </button>
        </div>
      </div>
    </div>
  );
}


function LandingPricing({nav}){
  const [view, setView] = useState("church");
  return (
    <div style={{background:"var(--navy)",padding:"80px 48px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"var(--gold)",marginBottom:10}}>Pricing</div>
          <h2 style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"white",marginBottom:12}}>Simple, Transparent Pricing</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",fontWeight:300,maxWidth:520,margin:"0 auto 28px"}}>No hidden fees. No subscriptions. Just results.</p>
          <div style={{display:"flex",justifyContent:"center",marginBottom:48}}>
            <div className="role-toggle" style={{background:"rgba(255,255,255,0.08)"}}>
              <button className={`role-toggle-btn${view==="church"?" active":""}`} onClick={()=>setView("church")} style={view==="church"?{background:"linear-gradient(135deg,var(--gold),var(--gold-light))",color:"var(--navy)"}:{color:"rgba(255,255,255,0.5)"}}>For Churches</button>
              <button className={`role-toggle-btn${view==="vendor"?" active":""}`} onClick={()=>setView("vendor")} style={view==="vendor"?{background:"linear-gradient(135deg,var(--gold),var(--gold-light))",color:"var(--navy)"}:{color:"rgba(255,255,255,0.5)"}}>For Vendors</button>
            </div>
          </div>
        </div>

        {view==="church" && (
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <div className="pricing-card featured" style={{background:"rgba(255,255,255,0.04)",border:"2px solid rgba(232,224,208,0.4)"}}>
              <div className="pricing-card-badge" style={{background:"linear-gradient(135deg,var(--gold),var(--gold-light))"}}>Always Free for Churches</div>
              <div className="pricing-role" style={{marginTop:16}}>Church / Ministry</div>
              <div className="pricing-name" style={{color:"white"}}>Completely Free</div>
              <div className="pricing-price" style={{color:"white"}}>$0 <span style={{color:"rgba(255,255,255,0.4)"}}>forever</span></div>
              <div className="pricing-desc" style={{color:"rgba(255,255,255,0.5)"}}>We believe in empowering ministries, not charging them. Post projects, receive bids, and hire vendors — all at no cost.</div>
              <ul className="pricing-features">
                {[
                  "Post unlimited projects",
                  "Receive competitive bids from verified vendors",
                  "Built-in messaging with every vendor",
                  "Review vendors before hiring",
                  "Payment protection on every hire",
                  "Faith-verified vendor network",
                ].map((f,i)=>(
                  <li key={i} className="pricing-feature">
                    <div className="pricing-feature-icon">✓</div>
                    <span style={{color:"rgba(255,255,255,0.75)"}}>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="land-cta-primary" style={{width:"100%",justifyContent:"center",fontSize:15}} onClick={()=>nav("auth")}>Post Your First Project — Free →</button>
              <div style={{marginTop:12,padding:"10px 14px",background:"rgba(245,240,232,0.06)",border:"1px solid rgba(245,240,232,0.12)",borderRadius:8,fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>
                Your church builds a permanent vendor roster, project history, and reputation — all in one place.
              </div>
            </div>
          </div>
        )}

        {view==="vendor" && (
          <div style={{maxWidth:820,margin:"0 auto"}}>
            <div className="pricing-grid">
              {/* FREE TIER */}
              <div className="pricing-card" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)"}}>
                <div className="pricing-role" style={{color:"rgba(255,255,255,0.5)"}}>Vendor</div>
                <div className="pricing-name" style={{color:"white"}}>Free</div>
                <div className="pricing-price" style={{color:"white"}}>$0 <span style={{color:"rgba(255,255,255,0.4)"}}>to start</span></div>
                <div className="pricing-desc" style={{color:"rgba(255,255,255,0.5)"}}>Browse projects, build your profile, and submit bids at no cost. Only pay when you win work.</div>
                <ul className="pricing-features" style={{marginBottom:20}}>
                  {[
                    {text:"10 bids per month", icon:"✓"},
                    {text:"Public vendor profile", icon:"✓"},
                    {text:"Built-in messaging", icon:"✓"},
                    {text:"10% platform fee on hire", icon:"✓", sub:"Capped at $200 max"},
                    {text:"Faith-Verified badge", icon:"✗", muted:true},
                    {text:"Featured in directory", icon:"✗", muted:true},
                  ].map((f,i)=>(
                    <li key={i} className="pricing-feature">
                      <div className="pricing-feature-icon" style={{background:f.muted?"rgba(255,255,255,0.08)":undefined}}>{f.icon}</div>
                      <span style={{color:f.muted?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.75)"}}>
                        {f.text}
                        {f.sub && <span style={{display:"block",fontSize:11,color:"rgba(232,224,208,0.7)",marginTop:2}}>{f.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="land-cta-secondary" style={{width:"100%",justifyContent:"center",borderColor:"rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.7)"}} onClick={()=>nav("auth")}>Get Started Free</button>
              </div>

              {/* PRO TIER */}
              <div className="pricing-card featured" style={{background:"rgba(255,255,255,0.06)",border:"2px solid rgba(232,224,208,0.5)"}}>
                <div className="pricing-card-badge">Most Popular</div>
                <div className="pricing-role" style={{marginTop:16,color:"var(--gold-light)"}}>Vendor Pro</div>
                <div className="pricing-name" style={{color:"white"}}>Pro</div>
                <div className="pricing-price" style={{color:"white"}}>$19 <span style={{color:"rgba(255,255,255,0.4)"}}>/month</span></div>
                <div className="pricing-desc" style={{color:"rgba(255,255,255,0.5)"}}>For serious vendors ready to grow their ministry client base. Unlimited bids, zero surprises.</div>
                <ul className="pricing-features" style={{marginBottom:20}}>
                  {[
                    {text:"Unlimited bids", icon:"✓", highlight:true},
                    {text:"Public vendor profile", icon:"✓"},
                    {text:"Built-in messaging", icon:"✓"},
                    {text:"10% platform fee on hire", icon:"✓", sub:"Capped at $200 max"},
                    {text:"✦ Faith-Verified badge", icon:"✓"},
                    {text:"Featured in directory", icon:"✓"},
                  ].map((f,i)=>(
                    <li key={i} className="pricing-feature">
                      <div className="pricing-feature-icon">{f.icon}</div>
                      <span style={{color:"rgba(255,255,255,0.85)",fontWeight:f.highlight?600:400}}>
                        {f.text}
                        {f.sub && <span style={{display:"block",fontSize:11,color:"rgba(232,224,208,0.7)",marginTop:2}}>{f.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="land-cta-primary" style={{width:"100%",justifyContent:"center",fontSize:15}} onClick={()=>nav("auth")}>Start Winning Projects →</button>
                <div style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:10}}>Cancel anytime · No contracts</div>
                <div style={{marginTop:12,padding:"10px 14px",background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:8,fontSize:11,color:"rgba(216,180,254,0.8)",textAlign:"center"}}>
                  Pro members see new projects 24hrs early — before free vendors can bid.
                </div>
              </div>
            </div>

            {/* Fee explainer */}
            <div style={{marginTop:24,padding:"16px 20px",background:"rgba(232,224,208,0.08)",border:"1px solid rgba(232,224,208,0.2)",borderRadius:12,display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:4,background:"rgba(232,224,208,0.15)",border:"1px solid rgba(232,224,208,0.25)",flexShrink:0}}></div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--gold-light)",marginBottom:4}}>How the platform fee works</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.7}}>When a church hires you, a one-time platform fee of <strong style={{color:"rgba(255,255,255,0.75)"}}>10% of your bid (max $200)</strong> is charged. On a $2,000 project that's just $200 — and you keep the remaining $1,800. Compare that to Upwork (10%), Fiverr (20%), or Angi (15–20%). <strong style={{color:"var(--gold-light)"}}>We only make money when you do.</strong></div>
                <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:100,fontSize:11,color:"#4ade80",fontWeight:600}}>
                  1% of every commission goes to a ministry fund
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LANDING — TESTIMONIALS
══════════════════════════════════ */
function LandingTestimonials(){
  const TESTIMONIALS = [
    {quote:"We posted our website project on a Friday and had 8 bids by Monday. We hired a fantastic designer who understood our vision immediately. Incredible platform.",author:"Pastor David M.",role:"Grace Fellowship Church",city:"Dallas, TX",rating:5,avatar:"CH"},
    {quote:"As a Christian AV company, finding churches that share our values used to be impossible. KingdomBid changed everything. We've landed 4 projects in 2 months.",author:"Marcus T.",role:"Summit Sound & AV",city:"Phoenix, AZ",rating:5,avatar:""},
    {quote:"The faith verification process gave us peace of mind. Every vendor we've worked with has been professional, honest, and genuinely cares about ministry.",author:"Elder Sarah K.",role:"New Life Community Church",city:"Charlotte, NC",rating:5,avatar:"CH"},
  ];
  return (
    <div style={{background:"var(--cream)",padding:"80px 48px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"var(--gold)",marginBottom:10}}>Testimonials</div>
          <h2 style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)",marginBottom:12}}>Trusted by Ministries Across America</h2>
          <div style={{display:"flex",justifyContent:"center",gap:4,fontSize:18,color:"var(--gold)"}}>★★★★★</div>
        </div>
        <div className="testimonial-grid">
          {TESTIMONIALS.map((t,i)=>(
            <div key={i} className="testimonial-card">
              <div style={{fontSize:28,color:"var(--gold)",fontFamily:"Georgia,serif",lineHeight:1,marginBottom:12}}>"</div>
              <div style={{fontSize:14,color:"var(--text-mid)",lineHeight:1.75,fontWeight:300,marginBottom:20,fontStyle:"italic"}}>{t.quote}</div>
              <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:16,borderTop:"1px solid var(--border)"}}>
                <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,var(--navy-light),var(--navy))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{t.avatar}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>{t.author}</div>
                  <div style={{fontSize:11,color:"var(--text-muted)"}}>{t.role} · {t.city}</div>
                </div>
                <div style={{marginLeft:"auto",fontSize:12,color:"var(--gold)"}}>★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   LANDING — FAQ
══════════════════════════════════ */
function LandingFAQ(){
  const [open, setOpen] = useState(null);
  const FAQS = [
    {q:"Is it really free for churches?", a:"Yes, completely. Churches can post unlimited projects, receive bids, message vendors, and hire — all for free, forever. We believe in empowering ministries, not charging them."},
    {q:"How does the platform fee work for vendors?", a:"When a church hires you, we charge a one-time platform fee of 10% of your bid amount, capped at $200. On a $5,000 project that's $200 — and you keep $4,800. You only pay when you win work. Compare that to Upwork or Fiverr where fees are higher and charged regardless."},
    {q:"What does 'Faith-Verified' mean?", a:"Faith-Verified vendors have submitted a faith statement and been reviewed by our team. It signals to churches that this vendor shares Christian values and is committed to serving ministries with integrity."},
    {q:"How is this different from Upwork or Thumbtack?", a:"We're built exclusively for the faith community. Every church and vendor on this platform is here specifically to serve or work with ministries. That shared mission changes the quality of relationships, communication, and work."},
    {q:"What if I'm unhappy with a vendor?", a:"We have a dispute resolution center. If a project goes wrong, our team mediates between the church and vendor to reach a fair resolution. We take the integrity of every transaction seriously."},
    {q:"Can vendors contact churches outside the platform?", a:"Yes — once hired, communication can happen anywhere. We don't lock you in. Our goal is to be useful enough that you want to keep using us for your next project."},
  ];
  return (
    <div style={{background:"white",padding:"80px 48px"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:2,textTransform:"uppercase",color:"var(--gold)",marginBottom:10}}>FAQ</div>
          <h2 style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)"}}>Common Questions</h2>
        </div>
        {FAQS.map((f,i)=>(
          <div key={i} className="faq-item">
            <div className="faq-q" onClick={()=>setOpen(open===i?null:i)}>
              <span>{f.q}</span>
              <span style={{fontSize:18,color:"var(--gold)",transition:"transform 0.2s",transform:open===i?"rotate(45deg)":"rotate(0)",flexShrink:0,marginLeft:16}}>+</span>
            </div>
            {open===i && <div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingScreen({nav}){
  // Placeholder numbers shown immediately — replaced by real data once loaded
  const [stats, setStats] = useState({ churches:200, vendors:150, projects:500, rating:"5.0", loaded:false });

  useEffect(() => {
    const fetchStats = async () => {
      const [churchRes, vendorRes, projectRes, reviewRes] = await Promise.all([
        supabase.from("profiles").select("id", {count:"exact"}).eq("role","church"),
        supabase.from("vendors").select("id", {count:"exact"}).eq("verified", true),
        supabase.from("projects").select("id", {count:"exact"}),
        supabase.from("reviews").select("rating"),
      ]);
      const churches = churchRes.count || 0;
      const vendors = vendorRes.count || 0;
      const projects = projectRes.count || 0;
      const reviews = reviewRes.data || [];
      const avgRating = reviews.length > 0
        ? (reviews.reduce((a,r) => a + (r.rating||5), 0) / reviews.length).toFixed(1)
        : "5.0";
      // Only update if we got real data; otherwise keep placeholders
      if (churches > 0 || vendors > 0 || projects > 0) {
        setStats({ churches, vendors, projects, rating: avgRating, loaded:true });
      } else {
        setStats(s => ({...s, loaded:true}));
      }
    };
    fetchStats();
  }, []);

  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K+` : n > 0 ? `${n}+` : "—";

  return (
    <div>
      <div className="land-hero">
        <nav className="land-nav">
          <div className="land-logo" style={{cursor:"pointer"}} onClick={()=>nav("landing")}>
            <div className="land-logo-icon"><CrossLogo size={48}/></div>
            <span className="land-logo-name">Kingdom<span>Bid</span></span>
          </div>
          <div className="land-nav-links">
            <button className="land-nav-btn land-nav-login" style={{fontSize:12,color:"rgba(255,255,255,0.5)"}} onClick={()=>{const el=document.getElementById("faith-verified-section");if(el)el.scrollIntoView({behavior:"smooth"});}}>Faith Verified</button>
            <button className="land-nav-btn land-nav-login" onClick={()=>nav("auth")}>Log In</button>
            <button className="land-nav-btn land-nav-signup" onClick={()=>nav("auth")}>Get Started Free</button>
          </div>
        </nav>
        {/* Ambient glow orbs */}
        <div className="glow-orb hero-glow-1"/>
        <div className="glow-orb hero-glow-2"/>
        <div className="glow-orb hero-glow-3"/>
        <div className="land-hero-body" style={{paddingTop:"80px",paddingBottom:"80px",gap:0}}>

          {/* Eyebrow */}
          <div style={{fontSize:11,fontWeight:600,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.35)",marginBottom:32,animation:"fadeInUp 0.7s ease both"}}>The Faith-Based Service Marketplace</div>

          {/* Headline */}
          <h1 className="land-h1 land-animate-in-d1" style={{marginBottom:28}}>Where Churches Find <span style={{display:"inline-flex",alignItems:"center",gap:0,fontStyle:"italic",color:"#D4C9B0"}}>
            <span className="cross-animate cross-glow" style={{display:"inline-flex",alignItems:"center",lineHeight:1}}>
              <svg viewBox="0 0 60 90" style={{width:"0.65em",height:"0.98em",verticalAlign:"middle",marginRight:"0.03em",marginBottom:"0.05em"}} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="brushBlur">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced"/>
                    <feGaussianBlur in="displaced" stdDeviation="0.4" result="blurred"/>
                    <feComposite in="blurred" in2="SourceGraphic" operator="in"/>
                  </filter>
                  <filter id="roughEdge">
                    <feTurbulence type="turbulence" baseFrequency="0.04 0.12" numOctaves="3" seed="5" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
                  </filter>
                </defs>
                <path d="M27,1 C26.5,1 25.8,0.8 25.5,2 L24.8,18 L23.5,85 C23.4,87 24.2,89.5 25.8,89.8 C27.2,90.1 28.8,90.1 30.2,89.8 C31.8,89.4 32.8,88 33.2,86 L34,70 L35.2,22 L35.5,4 C35.5,2 34.8,0.9 33.5,0.7 C31.5,0.4 28.8,0.6 27,1 Z" fill="#D4C9B0" filter="url(#roughEdge)" opacity="0.97"/>
                <path d="M1,26 C0.5,26.5 0.2,27.5 0.8,28.8 C1.2,29.8 2.5,31 4,31.2 L22,32 L38,31.8 L56,31.2 C58,31 59.5,30 59.8,28.5 C60.1,27 59.5,25.8 58,25 C56.5,24.2 54,23.8 52,24 L38,24.5 L22,24.2 L6,23.8 C3.5,23.6 1.5,24.5 1,26 Z" fill="#D4C9B0" filter="url(#roughEdge)" opacity="0.97"/>
                <line x1="26" y1="2" x2="25.5" y2="88" stroke="rgba(212,201,176,0.3)" strokeWidth="0.7" strokeLinecap="round"/>
                <line x1="30" y1="1" x2="30" y2="89" stroke="rgba(212,201,176,0.25)" strokeWidth="0.6" strokeLinecap="round"/>
                <line x1="33.5" y1="3" x2="34" y2="87" stroke="rgba(212,201,176,0.2)" strokeWidth="0.5" strokeLinecap="round"/>
                <line x1="1" y1="27.5" x2="59" y2="27" stroke="rgba(212,201,176,0.25)" strokeWidth="0.6" strokeLinecap="round"/>
                <line x1="2" y1="30" x2="58" y2="30.5" stroke="rgba(212,201,176,0.2)" strokeWidth="0.5" strokeLinecap="round"/>
                <rect x="23.5" y="24" width="12" height="8" fill="rgba(180,110,10,0.18)" rx="1"/>
              </svg>
            </span>rusted</span> Christian Vendors</h1>

          {/* Subheadline */}
          <p className="land-sub land-animate-in-d2" style={{marginBottom:44}}>Post projects, receive bids, and hire verified faith-based businesses — all in one place built for ministry.</p>

          {/* CTAs */}
          <div className="land-ctas land-animate-in-d3" style={{marginBottom:72}}>
            <button className="land-cta-primary cta-glow" onClick={()=>nav("auth")}>Post a Project — Free</button>
            <button className="land-cta-secondary" onClick={()=>nav("auth")}>I'm a Christian Vendor</button>
          </div>

          {/* Stats — with more breathing room */}
          <div style={{width:"100%",maxWidth:640,borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:40}}>
            <div className="land-stats land-animate-in-d4" style={{justifyContent:"space-between",margin:0}}>
              {[
                {num:fmt(stats.churches), label:"Active Churches"},
                {num:fmt(stats.vendors),  label:"Verified Vendors"},
                {num:fmt(stats.projects), label:"Projects Posted"},
                {num:stats.rating+"★",   label:"Avg Vendor Rating"},
              ].map((s,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div className="land-stat-num stat-glow">{s.num}</div>
                  <div className="land-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 1% line — spaced below stats */}
            <div style={{marginTop:36,display:"flex",alignItems:"center",justifyContent:"center",gap:20}}>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.07)"}}/>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",fontWeight:400,letterSpacing:0.8,whiteSpace:"nowrap"}}>
                1% of every commission is donated to a ministry fund
              </div>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.07)"}}/>
            </div>
          </div>

        </div>
      </div>

      {/* ── SEAMLESS BRIDGE — continues light from hero into section 2 ── */}
      <div style={{background:"var(--navy)",height:1,position:"relative",overflow:"visible"}}>
        <div style={{position:"absolute",top:-120,left:"50%",transform:"translateX(-50%)",width:800,height:240,background:"radial-gradient(ellipse,rgba(245,240,232,0.04) 0%,transparent 70%)",pointerEvents:"none",zIndex:1}}/>
      </div>

      {/* ── CATEGORIES ── */}
      <div style={{background:"var(--navy)",padding:"64px 0 64px",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",filter:"blur(28px)",background:"radial-gradient(ellipse 70% 55% at 85% 25%, rgba(61,80,40,0.65) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 15% 70%, rgba(55,72,34,0.55) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 50% 50%, rgba(58,76,37,0.5) 0%, transparent 55%), radial-gradient(ellipse 40% 40% at 30% 10%, rgba(50,65,30,0.45) 0%, transparent 55%), radial-gradient(ellipse 35% 35% at 70% 90%, rgba(52,68,32,0.45) 0%, transparent 55%)"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 48px",position:"relative",zIndex:1}}>
          {/* Header row */}
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:32,marginBottom:52}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",marginBottom:16,opacity:0.6}}>What We Cover</div>
              <div style={{fontSize:52,fontWeight:800,color:"white",lineHeight:1,letterSpacing:-2,fontFamily:"DM Sans,sans-serif"}}>
                Every service.<br/><span style={{color:"rgba(255,255,255,0.2)"}}>Every ministry.</span>
              </div>
            </div>
            <button
              onClick={()=>nav("vendors")}
              style={{padding:"12px 24px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.55)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",letterSpacing:0.3,transition:"all 0.2s",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.color="white";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.55)";}}
            >Browse all vendors</button>
          </div>

          {/* 2-column compact grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden"}}>
            {CATEGORIES.map((c,i)=>(
              <div
                key={c.label}
                onClick={()=>nav("vendors")}
                style={{
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"20px 28px",
                  background:"#0e1a0b",
                  cursor:"pointer",transition:"background 0.15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                onMouseLeave={e=>e.currentTarget.style.background="#0e1a0b"}
              >
                <div style={{display:"flex",alignItems:"center",gap:20}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.18)",letterSpacing:1,width:20,flexShrink:0}}>{String(i+1).padStart(2,"0")}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.78)",letterSpacing:-0.1}}>{c.label}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.22)",marginTop:2}}>{c.count}+ providers</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.12)"}}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAITH VERIFIED ── */}
      <LandingFaithVerified nav={nav}/>

      {/* ── PRICING ── */}
      <LandingPricing nav={nav}/>

      {/* ── TESTIMONIALS ── */}
      <LandingTestimonials/>

      {/* ── FAQ ── */}
      <LandingFAQ/>

      {/* ── FINAL CTA ── */}
      <div className="land-section" style={{textAlign:"center"}}>
        <div className="land-section-eyebrow">Get Started</div>
        <h2 className="land-section-title">Ready to Serve or Be Served?</h2>
        <p className="land-section-sub">Join {stats.churches > 0 ? `${fmt(stats.churches)} churches` : "churches"} and {stats.vendors > 0 ? `${fmt(stats.vendors)} Christian vendors` : "Christian vendors"} already on KingdomBid.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
          <button className="land-cta-primary" onClick={()=>nav("auth")}>Post a Project — Free</button>
          <button onClick={()=>nav("auth")} style={{background:"var(--navy)",border:"none",color:"rgba(255,255,255,0.8)",padding:"15px 28px",borderRadius:12,fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Join as a Vendor</button>
        </div>
        <div style={{fontSize:12,color:"var(--text-muted)",letterSpacing:0.2}}>1% of every commission is donated to a ministry fund</div>
      </div>

      {/* ── ABOUT / AMBASSADOR / PARTNER STRIP — techy ── */}
      <div style={{background:"#0a1208",borderTop:"1px solid rgba(255,255,255,0.05)",position:"relative",overflow:"hidden"}}>
        {/* Grid background texture */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 48px",position:"relative",zIndex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1px 1fr 1px 1fr"}}>
            {/* Column data */}
            {[
              {label:"About KingdomBid",tag:"STORY",body:"Built for the Kingdom. Our mission, our values, and why we believe faith-aligned work changes everything.",cta:"Our Story",screen:"about"},
              {label:"Ambassador Program",tag:"PROGRAM",body:"Spread the mission. Build your career. Serve the Kingdom. Open to ministry students and campus leaders.",cta:"Apply Now",screen:"ambassador"},
              {label:"Partner With Us",tag:"PARTNER",body:"Churches and organizations that want to build the Kingdom alongside us. Let's go further together.",cta:"Learn More",screen:"partner"},
            ].reduce((acc, col, i) => {
              // Insert divider between cols
              acc.push(
                <div key={`col-${i}`} style={{padding:"52px 40px"}}>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:18,fontFamily:"DM Mono,monospace"}}>{col.tag}</div>
                  <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"white",marginBottom:12,lineHeight:1.2}}>{col.label}</div>
                  <div style={{fontSize:13,color:"rgba(255,255,255,0.32)",lineHeight:1.8,fontWeight:300,marginBottom:22}}>{col.body}</div>
                  <button onClick={()=>nav(col.screen)} style={{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"1px solid rgba(232,224,208,0.15)",borderRadius:6,color:"var(--gold-light)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",letterSpacing:0.5,padding:"7px 16px",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(232,224,208,0.06)";e.currentTarget.style.borderColor="rgba(232,224,208,0.3)";}} onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor="rgba(232,224,208,0.15)";}}>
                    {col.cta} <span style={{fontSize:10,opacity:0.6}}>→</span>
                  </button>
                </div>
              );
              if (i < 2) acc.push(
                <div key={`div-${i}`} style={{background:"linear-gradient(to bottom,transparent,rgba(255,255,255,0.08) 20%,rgba(255,255,255,0.08) 80%,transparent)",width:1}}/>
              );
              return acc;
            }, [])}
          </div>
        </div>
      </div>

      <footer className="land-footer">
        <div className="land-logo" style={{cursor:"pointer"}} onClick={()=>nav("landing")}>
          <div className="land-logo-icon" style={{width:36,height:36,fontSize:11}}><CrossLogo size={36}/></div>
          <span className="land-logo-name" style={{fontSize:14}}>Kingdom<span>Bid</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
          {["about","ambassador","partner"].map((s,i)=>(
            <button key={i} onClick={()=>nav(s)} style={{background:"none",border:"none",fontSize:12,color:"rgba(255,255,255,0.28)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textTransform:"capitalize",letterSpacing:0.2}}>{s==="partner"?"Partner With Us":s==="ambassador"?"Ambassador":s==="about"?"About":s}</button>
          ))}
          <div className="land-footer-copy">© 2025 KingdomBid. Built for the Kingdom.</div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════
   ABOUT PAGE
══════════════════════════════════ */
function AboutScreen({nav}){
  const PAINS = [
    {num:"01",title:"The right vendors are invisible.",body:"Churches post in Facebook groups and cross their fingers. The best designers, musicians, and contractors — the ones who actually want to serve ministry — have no dedicated place to be found.",counter:"Word of mouth misses 9 out of 10 qualified candidates."},
    {num:"02",title:"Vetting is a full-time job.",body:"Portfolio, references, values alignment, pricing, availability — every hire is a research project. Multiply that by every project your church runs this year.",counter:"The average church spends 3+ weeks vetting a single vendor."},
    {num:"03",title:"Communication lives in ten different places.",body:"Email threads, text messages, voicemails, DMs. Nobody has the full picture. Projects stall. Staff burn out.",counter:"60% of ministry staff name vendor management as their biggest admin burden."},
    {num:"04",title:"Talented believers can't find kingdom work.",body:"Hundreds of thousands of Christian professionals want to build their career around their faith. Right now, there's nowhere to go.",counter:"400,000+ Christian freelancers are actively looking for ministry-aligned clients."},
  ];
  const [active, setActive] = useState(null);
  const TEAM = [
    {name:"Built on purpose.", role:"KingdomBid was created because ministry deserves better infrastructure — and because Christian professionals deserve a home."},
    {name:"Faith-first, always.", role:"Every decision we make is filtered through one question: does this serve the Kingdom? That includes how we charge, who we approve, and how we resolve disputes."},
    {name:"1% back to ministry.", role:"One percent of every commission is set aside for a ministry fund. We're still deciding exactly how it's deployed — but it goes back to the work, not to us."},
  ];
  return (
    <div style={{background:"var(--cream)",minHeight:"100vh"}}>
      {/* Nav */}
      <div style={{background:"var(--navy)",padding:"20px 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("landing")} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--navy)"}}>K</div>
          <span style={{fontFamily:"Playfair Display,serif",fontSize:15,color:"white",fontWeight:600}}>Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span></span>
        </button>
        <button onClick={()=>nav("landing")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back to Home</button>
      </div>

      {/* Hero */}
      <div style={{background:"var(--navy)",padding:"96px 48px 80px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:20}}>About KingdomBid</div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(36px,5vw,60px)",fontWeight:700,color:"white",lineHeight:1.05,letterSpacing:-1,marginBottom:24}}>Built for the Kingdom.<br/><span style={{color:"rgba(255,255,255,0.25)"}}>Not for everyone.</span></h1>
          <p style={{fontSize:17,color:"rgba(255,255,255,0.45)",fontWeight:300,lineHeight:1.8,maxWidth:600}}>KingdomBid is the first dedicated marketplace connecting churches with faith-aligned service providers. We exist to make ministry work easier, more trusted, and more connected.</p>
        </div>
      </div>

      {/* Mission */}
      <div style={{background:"white",padding:"80px 48px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:16}}>Our Mission</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)",lineHeight:1.1,marginBottom:20}}>Every ministry deserves excellent partners.</h2>
            <p style={{fontSize:15,color:"var(--text-muted)",lineHeight:1.85,fontWeight:300,marginBottom:16}}>For too long, churches have had to rely on word of mouth, Facebook groups, and gut instinct to find the people who build their websites, run their sound, film their services, and design their graphics.</p>
            <p style={{fontSize:15,color:"var(--text-muted)",lineHeight:1.85,fontWeight:300}}>KingdomBid changes that. One platform, verified professionals, and a community that actually shares your values.</p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {TEAM.map((item,i)=>(
              <div key={i} style={{padding:"22px 24px",borderRadius:14,background:"var(--cream)",border:"1px solid var(--border)"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:16,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{item.name}</div>
                <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,fontWeight:300}}>{item.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Problem */}
      <div style={{background:"#0F1A0C",padding:"96px 0"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 48px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"end",paddingBottom:64,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",marginBottom:20,opacity:0.7}}>The Problem</div>
              <div style={{fontSize:48,fontWeight:800,color:"white",lineHeight:0.95,letterSpacing:-2,fontFamily:"DM Sans,sans-serif"}}>Ministry deserves<br/><span style={{color:"rgba(255,255,255,0.2)"}}>better tools.</span></div>
            </div>
            <div style={{paddingBottom:4}}>
              <p style={{fontSize:16,color:"rgba(255,255,255,0.35)",fontWeight:300,lineHeight:1.85,margin:0}}>Every church faces the same friction. They know what they need — but finding, vetting, and managing the right people costs more time than the work itself.</p>
            </div>
          </div>
          <div style={{marginTop:0}}>
            {PAINS.map((p,i)=>(
              <div key={i} onClick={()=>setActive(active===i?null:i)} style={{borderBottom:"1px solid rgba(255,255,255,0.06)",cursor:"pointer"}}>
                <div style={{display:"grid",gridTemplateColumns:"48px 1fr 32px",alignItems:"start",padding:"32px 0",gap:0}}>
                  <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.15)",letterSpacing:1,paddingTop:4}}>{p.num}</div>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:"white",letterSpacing:-0.3,fontFamily:"DM Sans,sans-serif",lineHeight:1.3}}>{p.title}</div>
                    {active===i&&(<div style={{marginTop:14,animation:"fadeUp 0.2s ease"}}><p style={{fontSize:14,color:"rgba(255,255,255,0.42)",fontWeight:300,lineHeight:1.85,margin:"0 0 14px 0"}}>{p.body}</p><div style={{display:"inline-block",padding:"6px 14px",background:"rgba(232,224,208,0.05)",border:"1px solid rgba(232,224,208,0.1)",borderRadius:4,fontSize:11,color:"rgba(232,224,208,0.55)",fontWeight:500,letterSpacing:0.2}}>{p.counter}</div></div>)}
                  </div>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingTop:4}}><div style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.25s",transform:active===i?"rotate(45deg)":"rotate(0deg)"}}><span style={{fontSize:13,color:"rgba(255,255,255,0.25)",lineHeight:1,marginTop:"-1px"}}>+</span></div></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:48,display:"flex",alignItems:"center",justifyContent:"space-between",gap:32}}>
            <div>
              <div style={{fontSize:24,fontWeight:700,color:"white",letterSpacing:-0.5,marginBottom:8,fontFamily:"DM Sans,sans-serif"}}>KingdomBid fixes all of it.</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.35)",fontWeight:300,lineHeight:1.7}}>One platform. Verified vendors. Transparent pricing. Built exclusively for churches.</div>
            </div>
            <button onClick={()=>nav("auth")} style={{padding:"14px 28px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap",flexShrink:0}}>Get started free</button>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div style={{background:"var(--navy)",padding:"28px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>© 2025 KingdomBid</div>
        <div style={{display:"flex",gap:20}}>{["ambassador","partner"].map(s=><button key={s} onClick={()=>nav(s)} style={{background:"none",border:"none",fontSize:12,color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",textTransform:"capitalize"}}>{s==="partner"?"Partner With Us":"Ambassador Program"}</button>)}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   AMBASSADOR PROGRAM PAGE
══════════════════════════════════ */
function AmbassadorScreen({nav}){
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({name:"",email:"",school:"",ministry:"",why:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const PERKS = [
    {title:"Ambassador Pro Account", desc:"Full vendor Pro tier for free — so you can actually win church projects through the platform while you represent it. A real client pipeline, not just a title."},
    {title:"Resume-Ready Credential", desc:"A verified 'KingdomBid Campus Ambassador' credential with a digital certificate. Ministry students and young professionals have told us this matters more than a discount."},
    {title:"First Access to Projects", desc:"Ambassadors see new church project postings 48 hours before the general vendor pool. You're first to bid, first to win."},
    {title:"Featured Profile Placement", desc:"Your vendor profile gets boosted in search results with the Campus Ambassador badge. Churches notice you first."},
    {title:"Referral Credit Stack", desc:"Every church or vendor you bring in earns you extended Pro time. Refer three people who land gigs and your account stays Pro indefinitely."},
    {title:"Direct Line to the Team", desc:"Ambassadors get a private channel to the KingdomBid team. Your feedback shapes the platform. You're not a customer — you're a builder."},
  ];

  const SCHOOLS = ["Bible college / seminary","Christian university","State university — campus ministry","Community college","Graduate / divinity school","Other"];

  const handleSubmit = async () => {
    if (!form.name||!form.email||!form.school||!form.why) return;
    await supabase.from("ambassador_applications").insert({name:form.name,email:form.email,school:form.school,ministry:form.ministry,why:form.why,status:"pending"}).catch(()=>{});
    setSubmitted(true);
  };

  return (
    <div style={{background:"var(--cream)",minHeight:"100vh"}}>
      {/* Nav */}
      <div style={{background:"var(--navy)",padding:"20px 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("landing")} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--navy)"}}>K</div>
          <span style={{fontFamily:"Playfair Display,serif",fontSize:15,color:"white",fontWeight:600}}>Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span></span>
        </button>
        <button onClick={()=>nav("landing")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back to Home</button>
      </div>

      {/* Hero */}
      <div style={{background:"var(--navy)",padding:"96px 48px 80px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:20}}>Ambassador Program</div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(36px,5vw,60px)",fontWeight:700,color:"white",lineHeight:1.05,letterSpacing:-1,marginBottom:24}}>Spread the mission.<br/><span style={{color:"var(--gold-light)"}}>Build your career.</span></h1>
          <p style={{fontSize:17,color:"rgba(255,255,255,0.45)",fontWeight:300,lineHeight:1.8,maxWidth:580}}>KingdomBid Ambassadors are ministry students, campus leaders, and young Christian professionals who believe faith-aligned work matters — and want to help build the platform that makes it possible.</p>
          <div style={{marginTop:36,display:"inline-flex",alignItems:"center",gap:12,padding:"12px 20px",background:"rgba(232,224,208,0.06)",border:"1px solid rgba(232,224,208,0.15)",borderRadius:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"var(--gold-light)",flexShrink:0}}/>
            <span style={{fontSize:13,color:"rgba(255,255,255,0.5)",fontWeight:400}}>No quotas. No pressure. Just real value for real people who believe in the mission.</span>
          </div>
        </div>
      </div>

      {/* Perks */}
      <div style={{background:"white",padding:"80px 48px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:14}}>What You Get</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)",marginBottom:12}}>Real rewards. Zero cost.</h2>
            <p style={{fontSize:15,color:"var(--text-muted)",fontWeight:300,maxWidth:480,margin:"0 auto",lineHeight:1.7}}>Every perk is something genuinely useful — not a discount code for something you'd never buy.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {PERKS.map((p,i)=>(
              <div key={i} style={{padding:"26px 24px",borderRadius:16,border:"1.5px solid var(--border)",background:"var(--cream)",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(0,0,0,0.07)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text-muted)",letterSpacing:1,marginBottom:12}}>{String(i+1).padStart(2,"0")}</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{p.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.7,fontWeight:300}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who we're looking for */}
      <div style={{background:"var(--navy)",padding:"80px 48px"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:16}}>Who We're Looking For</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"white",lineHeight:1.1,marginBottom:20}}>Ministry students and campus leaders who get it.</h2>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {["Bible college, seminary, or Christian university students","Campus ministry leaders (Cru, YoungLife, BCM, RUF, etc.)","Church communications, worship arts, or theology majors","Young professionals actively involved in local church ministry","Anyone who already recommends tools they love"].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:"1.5px solid rgba(232,224,208,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><div style={{width:6,height:6,borderRadius:"50%",background:"var(--gold-light)"}}/></div>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6,fontWeight:300}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"32px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--gold-light)",marginBottom:8}}>What you actually do:</div>
            {[{step:"Weekly",desc:"Post once about KingdomBid on your personal social media — organic, authentic, your own voice."},
              {step:"Monthly",desc:"Introduce KingdomBid to one church or campus ministry in your network."},
              {step:"Ongoing",desc:"Share your referral link when people ask what tools you use. That's it."}].map((item,i)=>(
              <div key={i} style={{padding:"14px 0",borderBottom:i<2?"1px solid rgba(255,255,255,0.06)":"none"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--gold-light)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{item.step}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6,fontWeight:300}}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application form */}
      <div style={{background:"var(--cream)",padding:"80px 48px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:14}}>Apply Now</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"var(--navy)",marginBottom:10}}>We review every application personally.</h2>
            <p style={{fontSize:14,color:"var(--text-muted)",fontWeight:300,lineHeight:1.7}}>Three questions. Honest answers. We respond within 72 hours.</p>
          </div>
          {submitted ? (
            <div style={{textAlign:"center",padding:"48px 32px",background:"white",borderRadius:20,border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,color:"var(--navy)",marginBottom:8}}>Application received.</div>
              <div style={{fontSize:14,color:"var(--text-muted)",lineHeight:1.7,maxWidth:360,margin:"0 auto"}}>We'll review your application and get back to you within 72 hours. Thank you for wanting to be part of this.</div>
              <button onClick={()=>nav("landing")} className="btn-primary" style={{marginTop:24}}>Back to KingdomBid</button>
            </div>
          ) : (
            <div style={{background:"white",borderRadius:20,border:"1px solid var(--border)",overflow:"hidden"}}>
              <div style={{background:"var(--navy)",padding:"24px 32px"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"white"}}>Ambassador Application</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>Takes about 3 minutes</div>
              </div>
              <div style={{padding:"28px 32px",display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="field" style={{marginBottom:0}}><label>Full Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your name"/></div>
                  <div className="field" style={{marginBottom:0}}><label>Email Address *</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@school.edu"/></div>
                </div>
                <div className="field" style={{marginBottom:0}}>
                  <label>School / Institution *</label>
                  <select value={form.school} onChange={e=>set("school",e.target.value)}>
                    <option value="">Select your situation...</option>
                    {SCHOOLS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{marginBottom:0}}><label>Ministry Involvement <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:400}}>— optional</span></label><input value={form.ministry} onChange={e=>set("ministry",e.target.value)} placeholder="e.g. BCM President, worship team, campus chaplain"/></div>
                <div className="field" style={{marginBottom:0}}>
                  <label>Why do you want to be a KingdomBid Ambassador? *</label>
                  <textarea rows={5} value={form.why} onChange={e=>set("why",e.target.value)} placeholder="Be honest — we read every answer and respond personally."/>
                </div>
                <button className="btn-primary" onClick={handleSubmit} disabled={!form.name||!form.email||!form.school||!form.why} style={{padding:"13px",fontSize:14,marginTop:4}}>Submit Application</button>
                <div style={{fontSize:11,color:"var(--text-muted)",textAlign:"center",lineHeight:1.6}}>We review every application personally and respond within 72 hours.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{background:"var(--navy)",padding:"28px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>© 2025 KingdomBid</div>
        <div style={{display:"flex",gap:20}}>{["about","partner"].map(s=><button key={s} onClick={()=>nav(s)} style={{background:"none",border:"none",fontSize:12,color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{s==="partner"?"Partner With Us":"About"}</button>)}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   PARTNER WITH US PAGE
══════════════════════════════════ */
function PartnerScreen({nav}){
  const [type, setType] = useState("church");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({name:"",email:"",org:"",city:"",size:"",message:""});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const CHURCH_PERKS = [
    {title:"Partner Church Badge", desc:"A verified 'KingdomBid Partner Church' badge on your platform profile and a digital asset for your website or bulletins."},
    {title:"Featured in Our Directory", desc:"Partner churches are spotlighted in a dedicated Partner Churches section visible to all vendors on the platform."},
    {title:"Early Feature Access", desc:"Partner churches get first access to new features — project templates, vendor recommendations, and scheduling tools — before general release."},
    {title:"Co-Marketing", desc:"We feature partner churches in our email newsletter, social media, and Ambassador network as model ministries using modern tools."},
    {title:"Dedicated Support", desc:"Partner churches get a direct line to the KingdomBid team — not a support ticket queue."},
    {title:"Annual Impact Report", desc:"We send you a custom annual report showing the vendors you've worked with, projects completed, and total ministry investment — shareable with your board."},
  ];
  const ORG_PERKS = [
    {title:"Co-Branded Partnership", desc:"Your organization is featured alongside KingdomBid in our communications. A genuine, visible partnership — not a logo in a footer."},
    {title:"Custom Integration Opportunities", desc:"Ministry networks, denominations, and seminaries can explore custom integrations — preferred vendor networks, student placement pipelines, and more."},
    {title:"Speaking & Content Access", desc:"KingdomBid team members are available for panels, podcasts, or content partnerships to discuss the future of faith-aligned work and ministry operations."},
    {title:"Revenue Share for Networks", desc:"Denominational networks or ministry coalitions that drive platform adoption may be eligible for a revenue share arrangement."},
  ];

  const CHURCH_SIZES = ["Under 100","100–250","250–500","500–1,000","1,000–2,500","2,500+"];

  const handleSubmit = async () => {
    if (!form.name||!form.email||!form.org) return;
    await supabase.from("partner_applications").insert({...form, partner_type:type, status:"pending"}).catch(()=>{});
    setSubmitted(true);
  };

  return (
    <div style={{background:"var(--cream)",minHeight:"100vh"}}>
      {/* Nav */}
      <div style={{background:"var(--navy)",padding:"20px 48px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button onClick={()=>nav("landing")} style={{display:"flex",alignItems:"center",gap:9,background:"none",border:"none",cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--navy)"}}>K</div>
          <span style={{fontFamily:"Playfair Display,serif",fontSize:15,color:"white",fontWeight:600}}>Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span></span>
        </button>
        <button onClick={()=>nav("landing")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back to Home</button>
      </div>

      {/* Hero */}
      <div style={{background:"var(--navy)",padding:"96px 48px 80px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:20}}>Partner With Us</div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(36px,5vw,60px)",fontWeight:700,color:"white",lineHeight:1.05,letterSpacing:-1,marginBottom:24}}>Build the Kingdom<br/><span style={{color:"var(--gold-light)"}}>together.</span></h1>
          <p style={{fontSize:17,color:"rgba(255,255,255,0.45)",fontWeight:300,lineHeight:1.8,maxWidth:580}}>Whether you're a church that's found real value in KingdomBid, or an organization that sees what we're building — let's make it go further together.</p>
        </div>
      </div>

      {/* Type selector */}
      <div style={{background:"white",padding:"72px 48px"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:14}}>Partnership Type</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"var(--navy)",marginBottom:28}}>What kind of partner are you?</h2>
            <div style={{display:"inline-flex",background:"var(--cream-dark)",borderRadius:100,padding:4}}>
              {[{id:"church",label:"Church or Ministry"},{id:"org",label:"Organization or Network"}].map(t=>(
                <button key={t.id} onClick={()=>setType(t.id)} style={{padding:"9px 22px",borderRadius:100,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif",background:type===t.id?"var(--navy)":"transparent",color:type===t.id?"white":"var(--text-muted)",transition:"all 0.2s"}}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:48}}>
            {(type==="church"?CHURCH_PERKS:ORG_PERKS).map((p,i)=>(
              <div key={i} style={{padding:"26px 24px",borderRadius:16,border:"1.5px solid var(--border)",background:"var(--cream)"}}>
                <div style={{width:32,height:2,background:"var(--navy)",marginBottom:16,borderRadius:1}}/>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{p.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.7,fontWeight:300}}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* What we ask in return */}
          <div style={{background:"var(--navy)",borderRadius:20,padding:"36px 40px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"center"}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:14}}>What We Ask in Return</div>
              <h3 style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,color:"white",lineHeight:1.2,marginBottom:16}}>Mutual credibility. Nothing more.</h3>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.8,fontWeight:300}}>A Partner Church has used KingdomBid for at least 3 projects. They're willing to display a Partner badge on their website and share honest feedback with their network. That's the whole ask.</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(type==="church"
                ? ["Complete 3+ projects on KingdomBid","Display the Partner Church badge on your website","Share your experience with peer churches when asked","Provide honest feedback to help us improve"]
                : ["Introduce KingdomBid to your network authentically","Be willing to co-create one piece of content per year","Provide testimonial or case study for the platform"]
              ).map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.06)":"none"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:"1.5px solid rgba(232,224,208,0.25)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><div style={{width:6,height:6,borderRadius:"50%",background:"var(--gold-light)"}}/></div>
                  <span style={{fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.6,fontWeight:300}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application form */}
      <div style={{background:"var(--cream)",padding:"80px 48px"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-text)",marginBottom:14}}>Get In Touch</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"var(--navy)",marginBottom:10}}>Start the conversation.</h2>
            <p style={{fontSize:14,color:"var(--text-muted)",fontWeight:300,lineHeight:1.7}}>Tell us who you are. We'll follow up personally.</p>
          </div>
          {submitted ? (
            <div style={{textAlign:"center",padding:"48px 32px",background:"white",borderRadius:20,border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"var(--navy)",marginBottom:8}}>We'll be in touch.</div>
              <div style={{fontSize:14,color:"var(--text-muted)",lineHeight:1.7,maxWidth:340,margin:"0 auto"}}>Thank you for reaching out. We respond to every partnership inquiry personally, usually within 2 business days.</div>
              <button onClick={()=>nav("landing")} className="btn-primary" style={{marginTop:24}}>Back to KingdomBid</button>
            </div>
          ) : (
            <div style={{background:"white",borderRadius:20,border:"1px solid var(--border)",overflow:"hidden"}}>
              <div style={{background:"var(--navy)",padding:"24px 32px"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"white"}}>Partnership Inquiry</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3}}>{type==="church"?"Church / Ministry":"Organization / Network"}</div>
              </div>
              <div style={{padding:"28px 32px",display:"flex",flexDirection:"column",gap:14}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="field" style={{marginBottom:0}}><label>Your Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Pastor / Director name"/></div>
                  <div className="field" style={{marginBottom:0}}><label>Email *</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@church.org"/></div>
                </div>
                <div className="field" style={{marginBottom:0}}><label>{type==="church"?"Church Name *":"Organization Name *"}</label><input value={form.org} onChange={e=>set("org",e.target.value)} placeholder={type==="church"?"Grace Fellowship Church":"Your organization"}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="field" style={{marginBottom:0}}><label>City, State</label><input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Dallas, TX"/></div>
                  {type==="church" && <div className="field" style={{marginBottom:0}}><label>Congregation Size</label><select value={form.size} onChange={e=>set("size",e.target.value)}><option value="">Select...</option>{CHURCH_SIZES.map(s=><option key={s}>{s}</option>)}</select></div>}
                </div>
                <div className="field" style={{marginBottom:0}}><label>Tell us about your interest</label><textarea rows={4} value={form.message} onChange={e=>set("message",e.target.value)} placeholder={type==="church"?"How has KingdomBid helped your ministry? What draws you to becoming a partner?":"What does your organization do and how do you see us working together?"}/></div>
                <button className="btn-primary" onClick={handleSubmit} disabled={!form.name||!form.email||!form.org} style={{padding:"13px",fontSize:14,marginTop:4}}>Send Partnership Inquiry</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{background:"var(--navy)",padding:"28px 48px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>© 2025 KingdomBid</div>
        <div style={{display:"flex",gap:20}}>{["about","ambassador"].map(s=><button key={s} onClick={()=>nav(s)} style={{background:"none",border:"none",fontSize:12,color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>{s==="ambassador"?"Ambassador Program":"About"}</button>)}</div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════
   AUTH
   Sub-components live OUTSIDE AuthScreen so React never
   recreates them on keystroke — fixing the typing bug
══════════════════════════════════ */

function AuthFloatingField({label, type, value, onChange, selectedRole}){
  const [focused, setFocused] = useState(false);
  const active = focused || !!value;
  return (
    <div style={{position:"relative",marginBottom:32}}>
      <label style={{
        position:"absolute",left:0,
        top:active?0:18,fontSize:active?10:15,fontWeight:active?700:300,
        letterSpacing:active?2:0,textTransform:active?"uppercase":"none",
        color:focused?"var(--gold-light)":"rgba(255,255,255,0.3)",
        transition:"all 0.2s ease",pointerEvents:"none",zIndex:1,
      }}>{label}</label>
      {type==="select"?(
        <select value={value} onChange={onChange}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{width:"100%",paddingTop:22,paddingBottom:10,background:"transparent",
            border:"none",borderBottom:`1.5px solid ${focused?"var(--gold-light)":"rgba(255,255,255,0.12)"}`,
            outline:"none",fontSize:16,color:value?"white":"transparent",
            fontFamily:"DM Sans,sans-serif",appearance:"none",cursor:"pointer",transition:"border-color 0.25s"}}
        >
          <option value="" style={{background:"#2A3520"}}></option>
          {selectedRole==="church"
            ?["Non-denominational","Baptist","Methodist","Presbyterian","Pentecostal","Catholic","Other"].map(d=><option key={d} style={{background:"#2A3520",color:"white"}}>{d}</option>)
            :CATEGORIES.map(c=><option key={c.label} value={c.label} style={{background:"#2A3520",color:"white"}}>{c.label}</option>)
          }
        </select>
      ):type==="textarea"?(
        <textarea value={value} onChange={onChange} rows={3}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{width:"100%",paddingTop:22,paddingBottom:10,background:"transparent",
            border:"none",borderBottom:`1.5px solid ${focused?"var(--gold-light)":"rgba(255,255,255,0.12)"}`,
            outline:"none",fontSize:16,color:"white",fontFamily:"DM Sans,sans-serif",
            resize:"none",transition:"border-color 0.25s",lineHeight:1.6}}
        />
      ):(
        <input type={type||"text"} value={value} onChange={onChange}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{width:"100%",paddingTop:22,paddingBottom:10,background:"transparent",
            border:"none",borderBottom:`1.5px solid ${focused?"var(--gold-light)":"rgba(255,255,255,0.12)"}`,
            outline:"none",fontSize:16,color:"white",fontFamily:"DM Sans,sans-serif",transition:"border-color 0.25s"}}
        />
      )}
    </div>
  );
}

function AuthPrimaryBtn({onClick,disabled,children}){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%",padding:"18px 0",background:"var(--gold-light)",color:"var(--navy)",
      border:"none",borderRadius:10,fontSize:15,fontWeight:700,
      cursor:disabled?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",
      letterSpacing:0.5,opacity:disabled?0.6:1,transition:"all 0.2s",
      boxShadow:"0 4px 24px rgba(245,240,232,0.15)",
    }}>{children}</button>
  );
}

function AuthShell({children,showProgress,step,totalSteps,nav}){
  return (
    <div style={{minHeight:"100vh",background:"var(--navy)",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:900,height:700,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(245,240,232,0.05) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-10%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(245,240,232,0.03) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"28px 48px",flexShrink:0,position:"relative",zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>nav("landing")}>
          <CrossLogo size={42}/>
          <span style={{fontFamily:"'Palatino Linotype',Palatino,'Book Antiqua',serif",fontSize:17,fontWeight:600,color:"white",letterSpacing:"0.3px"}}>Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span></span>
        </div>
        {showProgress?(
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {Array.from({length:totalSteps}).map((_,i)=>(
              <div key={i} style={{height:3,width:i<step?32:16,borderRadius:2,background:i<step?"var(--gold-light)":"rgba(255,255,255,0.1)",transition:"all 0.4s ease"}}/>
            ))}
          </div>
        ):(
          <button onClick={()=>nav("landing")} style={{background:"none",border:"none",fontSize:13,color:"rgba(255,255,255,0.3)",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back</button>
        )}
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"32px 24px",position:"relative",zIndex:2}}>
        <div style={{width:"100%",maxWidth:460,animation:"fadeUp 0.45s ease"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({nav,setRole,setCurrentUser,setUserProfile,onOnboard}){
  const [mode,setMode]=useState("role");
  const [selectedRole,setSelectedRole]=useState(null);
  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [cityState,setCityState]=useState("");
  const [denomination,setDenomination]=useState("");
  const [faithStatement,setFaithStatement]=useState("");
  const [form,setForm]=useState({name:"",email:"",password:"",org:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const TOTAL_STEPS=3;

  const handleLogin=async()=>{
    setLoading(true);setError("");
    try{
      const{data,error:err}=await supabase.auth.signInWithPassword({email:form.email,password:form.password});
      if(err)throw err;
      if(data?.user){
        // Check email confirmation
        if(!data.user.email_confirmed_at){
          setError("Please confirm your email address before signing in. Check your inbox for a confirmation link.");
          setLoading(false);
          return;
        }
        setCurrentUser&&setCurrentUser(data.user);
        const{data:profile}=await supabase.from("profiles").select("role, org_name").eq("id",data.user.id).maybeSingle();
        if(profile){setRole(profile.role||"church");setUserProfile&&setUserProfile(profile);}
        nav("projects");
      } else {
        throw new Error("No user session returned. Please try again.");
      }
    }catch(err){setError(err.message||"Invalid email or password.");}
    finally{setLoading(false);}
  };

  const handleSignup=async()=>{
    setLoading(true);setError("");
    try{
      const{data,error:signUpErr}=await supabase.auth.signUp({email:form.email,password:form.password});
      if(signUpErr)throw signUpErr;
      if(data.user){
        const{error:profileErr}=await supabase.from("profiles").insert({
          id:data.user.id,role:selectedRole,org_name:form.org,
          city:cityState,denomination:selectedRole==="church"?denomination:"",
          category:selectedRole==="vendor"?denomination:"",faith_statement:faithStatement,
        });
        if(profileErr)throw profileErr;
        if(selectedRole==="vendor"){
          const categoryObj=CATEGORIES.find(c=>c.label===denomination);
          await supabase.from("vendors").insert({
            user_id:data.user.id,name:form.org||form.name,category:denomination||"",
            city:cityState,bio:faithStatement,emoji:categoryObj?.icon||"",
            cover:"var(--navy)",verified:false,tier:"Basic",tags:[],faith_statement:faithStatement,
          });
        }
      }
      if(data?.user){
        setCurrentUser&&setCurrentUser(data.user);
        setUserProfile&&setUserProfile({role:selectedRole,org_name:form.org});
        setRole&&setRole(selectedRole);
      }
      if(onOnboard)onOnboard(selectedRole);
      else nav("projects");
    }catch(err){setError(err.message||"Something went wrong.");}
    finally{setLoading(false);}
  };

  const errBanner=error?(
    <div style={{padding:"12px 16px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,fontSize:13,color:"#FCA5A5",marginBottom:28}}>Error: {error}</div>
  ):null;

  if(mode==="login") return (
    <AuthShell nav={nav}>
      <div style={{marginBottom:48}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",fontWeight:700,marginBottom:18}}>Sign In</div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:52,fontWeight:700,color:"white",lineHeight:1,letterSpacing:-2,marginBottom:14}}>Welcome back.</div>
        <div style={{fontSize:15,color:"rgba(255,255,255,0.3)",fontWeight:300}}>Enter your details below.</div>
      </div>
      {errBanner}
      {error && error.includes("confirm your email") && (
        <div style={{marginTop:-16,marginBottom:20,textAlign:"center"}}>
          <button onClick={async()=>{
            if(!form.email){setError("Enter your email to resend.");return;}
            const{error:e}=await supabase.auth.resend({type:"signup",email:form.email});
            if(!e){setError("");alert("Confirmation email resent — check your inbox.");}
            else{setError(e.message);}
          }} style={{background:"none",border:"none",color:"var(--gold-light)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:600}}>Resend confirmation email →</button>
        </div>
      )}
      <AuthFloatingField label="Email address" type="email" value={form.email} onChange={e=>set("email",e.target.value)} selectedRole={selectedRole}/>
      <AuthFloatingField label="Password" type="password" value={form.password} onChange={e=>set("password",e.target.value)} selectedRole={selectedRole}/>
      <div style={{textAlign:"right",marginTop:-8,marginBottom:24}}>
        <button onClick={async()=>{
          if(!form.email){setError("Enter your email first.");return;}
          setLoading(true);
          const{error:e}=await supabase.auth.resetPasswordForEmail(form.email,{redirectTo:window.location.origin});
          setLoading(false);
          if(e){setError(e.message);}else{setError("");alert("Password reset link sent — check your email.");}
        }} style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",padding:0}}>Forgot password?</button>
      </div>
      <AuthPrimaryBtn onClick={handleLogin} disabled={loading}>{loading?"Signing in...":"Sign In →"}</AuthPrimaryBtn>
      <div style={{marginTop:24,fontSize:13,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
        Don't have an account?{" "}
        <button onClick={()=>{setMode("role");setError("");}} style={{background:"none",border:"none",color:"var(--gold-light)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:600}}>Create one →</button>
      </div>
    </AuthShell>
  );

  if(mode==="role") return (
    <AuthShell nav={nav}>
      <div style={{marginBottom:52}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",fontWeight:700,marginBottom:18}}>Get Started — It's Free</div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:52,fontWeight:700,color:"white",lineHeight:1,letterSpacing:-2,marginBottom:14}}>I am a...</div>
        <div style={{fontSize:15,color:"rgba(255,255,255,0.3)",fontWeight:300}}>Choose your path to continue.</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:40}}>
        {[
          {id:"church",label:"Church or Ministry",sub:"Post projects · Receive bids · Hire free"},
          {id:"vendor",label:"Service Provider",sub:"Find clients · Submit bids · Grow your business"},
        ].map((opt,i)=>{
          const active=selectedRole===opt.id;
          return (
            <div key={opt.id} onClick={()=>setSelectedRole(opt.id)} style={{
              padding:"26px 0",
              borderBottom:i===0?"1px solid rgba(255,255,255,0.07)":"none",
              borderTop:i===0?"1px solid rgba(255,255,255,0.07)":"none",
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"relative",
            }}>
              <div style={{position:"absolute",left:-24,top:"50%",transform:"translateY(-50%)",width:3,height:active?40:0,background:"var(--gold-light)",borderRadius:2,transition:"height 0.3s ease"}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:active?"white":"rgba(255,255,255,0.38)",transition:"color 0.25s",marginBottom:5,letterSpacing:-0.3}}>{opt.label}</div>
                <div style={{fontSize:12,color:active?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.18)",letterSpacing:0.3,transition:"color 0.25s"}}>{opt.sub}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",border:`1.5px solid ${active?"var(--gold-light)":"rgba(255,255,255,0.15)"}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color 0.25s",flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:"var(--gold-light)",opacity:active?1:0,transform:active?"scale(1)":"scale(0)",transition:"all 0.25s ease"}}/>
              </div>
            </div>
          );
        })}
      </div>
      <AuthPrimaryBtn onClick={()=>{if(selectedRole){setRole(selectedRole);setMode("signup");}}} disabled={!selectedRole}>
        {selectedRole?`Continue as ${selectedRole==="church"?"a Church":"a Vendor"} →`:"Select one to continue"}
      </AuthPrimaryBtn>
      <div style={{marginTop:24,fontSize:13,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
        Already have an account?{" "}
        <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:"var(--gold-light)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:600}}>Sign in →</button>
      </div>
    </AuthShell>
  );

  const steps=[
    {eyebrow:"Step 1 of 3",title:"Create your account.",sub:"You'll use these to sign in.",
     fields:<>
       <AuthFloatingField label="Full name" value={form.name} onChange={e=>set("name",e.target.value)} selectedRole={selectedRole}/>
       <AuthFloatingField label="Email address" type="email" value={form.email} onChange={e=>set("email",e.target.value)} selectedRole={selectedRole}/>
       <AuthFloatingField label="Password" type="password" value={form.password} onChange={e=>set("password",e.target.value)} selectedRole={selectedRole}/>
     </>},
    {eyebrow:"Step 2 of 3",title:selectedRole==="church"?"Your ministry.":"Your business.",sub:"This is what others will see.",
     fields:<>
       <AuthFloatingField label={selectedRole==="church"?"Church or Ministry name":"Business name"} value={form.org} onChange={e=>set("org",e.target.value)} selectedRole={selectedRole}/>
       <AuthFloatingField label="City, State" value={cityState} onChange={e=>setCityState(e.target.value)} selectedRole={selectedRole}/>
       <AuthFloatingField label={selectedRole==="church"?"Denomination":"Service category"} type="select" value={denomination} onChange={e=>setDenomination(e.target.value)} selectedRole={selectedRole}/>
     </>},
    {eyebrow:"Step 3 of 3",title:"Your faith story.",sub:"The heart of everything we do here.",
     fields:<>
       <AuthFloatingField label="Faith statement" type="textarea" value={faithStatement} onChange={e=>setFaithStatement(e.target.value)} selectedRole={selectedRole}/>
       <div style={{display:"flex",gap:14,alignItems:"flex-start",paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
         <input type="checkbox" style={{marginTop:3,accentColor:"var(--gold-light)",flexShrink:0,width:16,height:16,cursor:"pointer"}}/>
         <span style={{fontSize:13,color:"rgba(255,255,255,0.3)",lineHeight:1.7}}>I agree to the <strong style={{color:"var(--gold-light)",fontWeight:600}}>Terms of Service</strong> and <strong style={{color:"var(--gold-light)",fontWeight:600}}>Community Standards</strong>. I affirm this platform will be used in alignment with Christian values.</span>
       </div>
     </>},
  ];
  const cur=steps[step-1];

  return (
    <AuthShell showProgress step={step} totalSteps={TOTAL_STEPS} nav={nav}>
      <div style={{marginBottom:44}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"var(--gold-light)",fontWeight:700,marginBottom:18}}>{cur.eyebrow}</div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:44,fontWeight:700,color:"white",lineHeight:1.05,letterSpacing:-1.5,marginBottom:10}}>{cur.title}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.3)",fontWeight:300}}>{cur.sub}</div>
      </div>
      {errBanner}
      {cur.fields}
      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={()=>step>1?setStep(s=>s-1):setMode("role")} style={{
          width:52,height:54,background:"transparent",border:"1.5px solid rgba(255,255,255,0.1)",
          borderRadius:10,fontSize:18,color:"rgba(255,255,255,0.4)",cursor:"pointer",transition:"all 0.2s",flexShrink:0,
        }}>←</button>
        <div style={{flex:1}}>
          <AuthPrimaryBtn onClick={step<TOTAL_STEPS?()=>setStep(s=>s+1):handleSignup} disabled={loading}>
            {loading?"Creating account...":step<TOTAL_STEPS?"Continue →":"Create Account"}
          </AuthPrimaryBtn>
        </div>
      </div>
      <div style={{marginTop:24,fontSize:13,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
        Already have an account?{" "}
        <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:"var(--gold-light)",cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontSize:13,fontWeight:600}}>Sign in →</button>
      </div>
    </AuthShell>
  );
}

function ProjectsScreen({role, showToast, nav}){
  const [view, setView] = useState("board");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [stripeModal, setStripeModal] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [myBids, setMyBids] = useState([]);
  const [loadingMyBids, setLoadingMyBids] = useState(false);
  const [vendorVerified, setVendorVerified] = useState(null); // null=loading, false=not verified, true=verified, "pending"=pending

  useEffect(() => {
    fetchProjects();
    // Check vendor verification status
    if (role === "vendor") {
      supabase.auth.getUser().then(async ({data: authData}) => {
        const user = authData?.user;
        if (!user) return;
        const {data} = await supabase.from("vendors").select("verified,verification_status").eq("user_id", user.id).maybeSingle();
        if (data?.verified) setVendorVerified(true);
        else if (data?.verification_status === "pending") setVendorVerified("pending");
        else setVendorVerified(false);
      });
    }
    // Real-time: notify church when a new bid arrives on their projects
    const bidSub = supabase
      .channel("new-bids")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "bids",
      }, async payload => {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        // Check if this bid is on one of the church's projects
        const { data: proj } = await supabase
          .from("projects").select("church_id, title").eq("id", payload.new.project_id).maybeSingle();
        if (proj?.church_id === user.id) {
          showToast(`New bid on "${proj.title}" from ${payload.new.vendor_name}`);
          fetchProjects(); // refresh bid counts
        }
      })
      .subscribe();
    return () => bidSub.unsubscribe();
  }, []);

  const fetchBids = async (projectId) => {
    if (!projectId) return;
    setLoadingBids(true);
    const { data, error } = await supabase
      .from("bids")
      .select("*, vendors(rating, reviews_count)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setBids(data.map(b => ({
        id: b.id,
        vendor: b.vendor_name || "Unknown Vendor",
        emoji: b.vendor_emoji || "",
        category: b.category || "",
        amount: Number(b.amount) || 0,
        timeline: b.timeline || "",
        note: b.cover_letter || "",
        rating: b.vendors?.rating || 5.0,
        reviews: b.vendors?.reviews_count || 0,
        hired: b.status === "hired",
        declined: b.status === "declined",
        vendor_id: b.vendor_id,
      })));
    } else {
      setBids([]);
    }
    setLoadingBids(false);
  };

  const fetchMyBids = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;
    setLoadingMyBids(true);
    const { data, error } = await supabase
      .from("bids")
      .select("*, projects(title, church_name, city, budget, status)")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setMyBids(data);
    setLoadingMyBids(false);
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user || null;
    let query = supabase.from("projects").select("*").order("posted_at", { ascending: false });
    if (role === "church" && user) {
      query = query.eq("church_id", user.id);
    } else if (role === "vendor") {
      query = query.eq("status", "open");
    }
    const { data, error } = await query;
    if (!error && data) {
      setProjects(data.map(p => ({
        id: p.id,
        church_id: p.church_id || null,
        title: p.title,
        church: p.church_name || "Ministry",
        city: p.city || "",
        category: p.category || "",
        icon: p.icon || "",
        budget: p.budget || "",
        timeline: p.timeline || "",
        bids: p.bids_count || 0,
        status: p.status || "open",
        urgent: p.urgent || false,
        posted: p.posted_at ? new Date(p.posted_at).toLocaleDateString() : "—",
        desc: p.description || "",
        skills: p.skills || [],
        requirements: p.requirements || [],
        scope: p.scope || "",
      })));
    }
    setLoading(false);
  };

  const handlePostProject = async (data) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) { showToast("Error: Not signed in."); return; }
    const { data: profile } = await supabase.from("profiles").select("org_name, city").eq("id", user.id).maybeSingle();
    const { error } = await supabase.from("projects").insert({
      title: data.title,
      description: data.desc,
      category: data.category,
      icon: data.icon,
      budget: data.budget,
      timeline: data.timeline,
      status: "open",
      urgent: data.urgent || false,
      scope: data.scope,
      skills: data.skills,
      requirements: data.requirements,
      church_name: profile?.org_name || data.church || "Your Church",
      city: data.format === "virtual" ? "Remote" : (profile?.city || data.city || ""),
      church_id: user?.id || null,
      posted_at: new Date().toISOString(),
    });
    if (!error) { await fetchProjects(); setPostSuccess(true); }
    else { showToast("Error posting project: " + error.message); }
  };

  const handleAcceptBid = (bidId) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    // Show Stripe payment modal before confirming hire
    setStripeModal({ bid, project: selectedProject });
  };

  const confirmHire = async (bidId) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;
    setStripeModal(null);
    setBids(b=>b.map(x=>x.id===bidId?{...x,hired:true}:{...x,declined:!x.hired}));
    showToast("Vendor hired!");
    try {
      await supabase.from("bids").update({ status: "hired" }).eq("id", bidId);
      await supabase.from("bids")
        .update({ status: "declined" })
        .eq("project_id", selectedProject?.id)
        .neq("id", bidId);
      if (selectedProject?.id) {
        await supabase.from("projects").update({ status: "hired" }).eq("id", selectedProject.id);
        setProjects(ps => ps.map(p => p.id === selectedProject.id ? {...p, status: "hired"} : p));
      }
      const { data: authData2 } = await supabase.auth.getUser();
      const user = authData2?.user;
      const { data: profile } = await supabase.from("profiles").select("org_name").eq("id", user?.id).maybeSingle();
      const churchName = profile?.org_name || selectedProject?.church || "Church";

      // Notify the hired vendor
      if (bid.vendor_id) {
        await supabase.from("notifications").insert({
          user_id: bid.vendor_id,
          type: "bid_accepted",
          title: "You've been hired!",
          body: `${churchName} accepted your bid on "${selectedProject?.title}". Check your messages to get started.`,
          link: "messages",
          read: false,
          created_at: new Date().toISOString(),
        }).catch(()=>{});
      }
      // Notify declined vendors
      const declinedBids = bids.filter(b => b.id !== bidId && b.vendor_id);
      for (const db of declinedBids) {
        if (db.vendor_id) {
          await supabase.from("notifications").insert({
            user_id: db.vendor_id,
            type: "bid_declined",
            title: "Project filled",
            body: `Another vendor was selected for "${selectedProject?.title}". Keep bidding — your next win is coming.`,
            link: "projects",
            read: false,
            created_at: new Date().toISOString(),
          }).catch(()=>{});
        }
      }

      const { data: existing } = await supabase
        .from("conversations").select("id")
        .eq("church_id", user?.id)
        .eq("vendor_name", bid.vendor)
        .maybeSingle();
      if (!existing) {
        await supabase.from("conversations").insert({
          church_id: user?.id || null,
          church_name: churchName,
          vendor_id: bid.vendor_id || null,
          vendor_name: bid.vendor,
          vendor_emoji: bid.emoji || "",
          project_id: selectedProject?.id || null,
          status: "hired",
          last_message: `You hired ${bid.vendor} for this project.`,
          last_message_at: new Date().toISOString(),
        });
      } else {
        await supabase.from("conversations").update({ status: "hired" }).eq("id", existing.id);
      }
    } catch(err) {
      console.error("Hire error:", err);
    }
  };
  const handleDeclineBid = async (bidId) => {
    setBids(b=>b.map(x=>x.id===bidId?{...x,declined:true}:x));
    showToast("Bid declined.");
    await supabase.from("bids").update({ status: "declined" }).eq("id", bidId);
  };
  const reset = () => { setView("board"); setSelectedProject(null); setPostSuccess(false); setBidSuccess(false); };

  if(view==="post" && !postSuccess) return (<PostProject onSubmit={handlePostProject} onBack={()=>setView("board")}/>);
  if(view==="post" && postSuccess) return (
    <div className="page">
      <button className="btn-back" onClick={reset}>← Back to Projects</button>
      <div style={{maxWidth:560,margin:"0 auto",paddingTop:40,textAlign:"center",animation:"fadeUp 0.5s ease"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 24px",boxShadow:"0 12px 40px rgba(232,224,208,0.4)"}}>✦</div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"var(--navy)",marginBottom:10}}>Your project is live!</div>
        <div style={{fontSize:15,color:"var(--text-muted)",fontWeight:300,lineHeight:1.7,marginBottom:36}}>
          Faith-aligned vendors have been notified. Most projects receive their first bid within a few hours.
        </div>
        {/* What happens next */}
        <div style={{background:"white",borderRadius:16,border:"1.5px solid var(--border)",overflow:"hidden",marginBottom:24,textAlign:"left"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid var(--border)",fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)"}}>What happens next</div>
          {[
            {num:"01",title:"Vendors review your project",body:"Verified Christian vendors in your category will see your posting and start preparing bids."},
            {num:"02",title:"Bids arrive in your dashboard",body:"You'll get a notification for each new bid. Compare amounts, timelines, and cover letters."},
            {num:"03",title:"Hire the right fit",body:"Message vendors, ask questions, then hit Hire. Payment is held in escrow until you approve."},
            {num:"04",title:"Leave a review",body:"When the project wraps, we'll remind you to review your vendor — it helps the whole community."},
          ].map((s,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"48px 1fr",borderBottom:i<3?"1px solid var(--border)":"none"}}>
              <div style={{padding:"16px",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:18,borderRight:"1px solid var(--border)"}}>
                <span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--text-muted)",letterSpacing:1}}>{s.num}</span>
              </div>
              <div style={{padding:"16px 20px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6,fontWeight:300}}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={reset} style={{padding:"12px 24px"}}>View My Projects</button>
          <button className="btn-secondary" onClick={()=>nav("vendors")} style={{padding:"12px 20px"}}>Browse Vendors</button>
        </div>
      </div>
    </div>
  );
  const handleSubmitBid = async (bidData) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) { showToast("Please sign in to submit a bid"); return; }

    // Check for duplicate bid
    const { data: existing } = await supabase
      .from("bids")
      .select("id")
      .eq("project_id", selectedProject?.id)
      .eq("vendor_id", user.id)
      .maybeSingle();
    if (existing) { showToast("You've already submitted a bid on this project"); return; }

    // Get vendor info + tier
    const { data: vendorData } = await supabase
      .from("vendors").select("name, emoji, category, tier").eq("user_id", user.id).maybeSingle();

    // Enforce bid limit for free vendors
    if (!vendorData || vendorData.tier !== "Pro") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { count } = await supabase
        .from("bids")
        .select("id", { count: "exact" })
        .eq("vendor_id", user.id)
        .gte("created_at", startOfMonth.toISOString());
      if ((count || 0) >= 10) {
        setShowUpgradeModal(true);
        return;
      }
    }

    const { error } = await supabase.from("bids").insert({
      project_id: selectedProject?.id,
      church_id: selectedProject?.church_id || null,
      vendor_id: user.id,
      vendor_name: vendorData?.name || "Unknown Vendor",
      vendor_emoji: vendorData?.emoji || "",
      category: vendorData?.category || "",
      amount: bidData.amount,
      timeline: bidData.timeline,
      cover_letter: bidData.cover,
      milestones: bidData.milestones,
      status: "pending",
    });
    if (!error) {
      // Notify the church that a new bid arrived
      if (selectedProject?.church_id) {
        await supabase.from("notifications").insert({
          user_id: selectedProject.church_id,
          type: "new_bid",
          title: "New bid received",
          body: `${vendorData?.name || "A vendor"} bid $${Number(bidData.amount).toLocaleString()} on "${selectedProject?.title}"`,
          link: "projects",
          read: false,
          created_at: new Date().toISOString(),
        }).catch(()=>{});
      }
      // Always use direct count from bids table — never trust bids_count field
      const { count: realBidCount } = await supabase.from("bids").select("id",{count:"exact"}).eq("project_id", selectedProject?.id);
      await supabase.from("projects").update({ bids_count: realBidCount || 1 }).eq("id", selectedProject?.id);
      setProjects(ps => ps.map(p => p.id === selectedProject?.id ? {...p, bids: realBidCount || 1} : p));
      setBidSuccess(true);
    } else {
      showToast("Error submitting bid: " + error.message);
    }
  };

  if(view==="bid" && !bidSuccess) return (<BidForm project={selectedProject} onBack={()=>setView("detail")} onSubmit={handleSubmitBid}/>);
  if(view==="bid" && bidSuccess) return (
    <div className="page">
      <button className="btn-back" onClick={reset}>← Back to Projects</button>
      <div style={{maxWidth:520,margin:"0 auto",paddingTop:40,textAlign:"center",animation:"fadeUp 0.5s ease"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,var(--navy),var(--navy-light))",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:"0 12px 40px rgba(42,53,32,0.25)"}}><div style={{width:24,height:24,border:"3px solid var(--gold-light)",borderRadius:"50%",position:"relative"}}><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:8,height:8,borderRadius:"50%",background:"var(--gold-light)"}}/></div></div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"var(--navy)",marginBottom:10}}>Bid submitted!</div>
        <div style={{fontSize:15,color:"var(--text-muted)",fontWeight:300,lineHeight:1.7,marginBottom:32}}>
          Your bid on <strong style={{color:"var(--navy)"}}>{selectedProject?.title}</strong> is in. The church will review all bids and reach out if you're the right fit.
        </div>
        {/* Tips while you wait */}
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:16,padding:"24px",marginBottom:24,textAlign:"left",color:"white"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:16}}>While you wait</div>
          {[
            {icon:"",tip:"Complete your Faith Verification to stand out above unverified vendors."},
            {icon:"cam",tip:"Add a bio and portfolio to your profile — churches review it before hiring."},
            {icon:"msg",tip:"Respond to any church messages within the hour. Speed signals professionalism."},
          ].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<2?12:0}}>
              <span style={{fontSize:13,color:"var(--gold-light)",flexShrink:0,marginTop:1}}>{t.icon}</span>
              <span style={{fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{t.tip}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button className="btn-primary" onClick={reset}>Browse More Projects</button>
          <button className="btn-secondary" onClick={()=>nav("profile")}>Complete My Profile</button>
        </div>
      </div>
    </div>
  );
  if(view==="bids") return (
    <>
      <ManageBids project={selectedProject} bids={bids} loading={loadingBids} onAccept={handleAcceptBid} onDecline={handleDeclineBid} onBack={reset} showToast={showToast} onNav={nav}/>
      {stripeModal && (
        <StripePlatformFeeModal
          bid={stripeModal.bid}
          project={stripeModal.project}
          onClose={()=>setStripeModal(null)}
          onSuccess={()=>confirmHire(stripeModal.bid.id)}
          showToast={showToast}
        />
      )}
    </>
  );
  if(view==="detail" && selectedProject) return (<ProjectDetail project={selectedProject} role={role} onBack={reset} onBid={()=>setView("bid")} onManageBids={()=>{fetchBids(selectedProject?.id);setView("bids");}} onProjectUpdate={(updated)=>{setSelectedProject(updated);setProjects(ps=>ps.map(p=>p.id===updated.id?{...p,...updated}:p));}} onComplete={async(projectId)=>{
    await supabase.from("projects").update({status:"completed"}).eq("id",projectId);
    const hiredBid = bids.find(b=>b.hired);
    if (hiredBid?.vendor_id) {
      const { data: v } = await supabase.from("vendors").select("projects_count").eq("user_id", hiredBid.vendor_id).maybeSingle();
      await supabase.from("vendors").update({ projects_count: (v?.projects_count||0)+1 }).eq("user_id", hiredBid.vendor_id);
    }
    // Auto-prompt review: write notification and redirect church to reviews tab
    const { data: { user } } = await supabase.auth.getUser().catch(()=>({data:{user:null}}));
    if (user) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "review_prompt",
        title: "Leave a review",
        body: `Your project "${selectedProject?.title}" is complete. Rate ${hiredBid?.vendor_name || "your vendor"} to help the community.`,
        link: "reviews",
        read: false,
        created_at: new Date().toISOString(),
      }).catch(()=>{});
    }
    setProjects(ps=>ps.map(p=>p.id===projectId?{...p,status:"completed"}:p));
    setSelectedProject(sp=>sp?{...sp,status:"completed"}:sp);
    showToast("Project complete! Head to Reviews to rate your vendor.");
    setTimeout(()=>nav("reviews"), 1800);
  }}/>);
  if(view==="mybids") return (
    <MyBidsScreen bids={myBids} loading={loadingMyBids} onBack={()=>setView("board")}/>
  );

  return (
    <>
      <ProjectBoard projects={projects} loading={loading} role={role} onSelect={p=>{setSelectedProject(p);setView("detail");}} onPost={()=>setView("post")} onMyBids={()=>{fetchMyBids();setView("mybids");}} showToast={showToast} nav={nav} vendorVerified={vendorVerified}/>
      {showUpgradeModal && <UpgradeModal onClose={()=>setShowUpgradeModal(false)} onUpgrade={()=>setShowUpgradeModal(false)}/>}
    </>
  );
}

function ProjectBoard({projects, loading, role, onSelect, onPost, onMyBids, showToast, nav, vendorVerified}){
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id || null));
  }, []);

  const cats = ["All", ...Array.from(new Set(projects.map(p=>p.category).filter(Boolean)))];

  const filtered = projects
    .filter(p=>{
      const ms = p.title.toLowerCase().includes(search.toLowerCase())||(p.church||"").toLowerCase().includes(search.toLowerCase())||(p.category||"").toLowerCase().includes(search.toLowerCase());
      const mf = statusFilter==="All"||(statusFilter==="Urgent"&&p.urgent)||(statusFilter==="Open"&&p.status==="open"&&!p.urgent)||(statusFilter==="In Review"&&p.status==="review")||(statusFilter==="Hired"&&p.status==="hired");
      const cf = catFilter==="All"||p.category===catFilter;
      const mine = !myProjectsOnly || p.church_id === currentUserId;
      return ms&&mf&&cf&&mine;
    })
    .sort((a,b)=>{
      if(sortBy==="newest") return new Date(b.posted||0)-new Date(a.posted||0);
      if(sortBy==="bids") return (b.bids||0)-(a.bids||0);
      if(sortBy==="budget-hi"){const va=parseInt((a.budget||"0").replace(/[^0-9]/g,""))||0;const vb=parseInt((b.budget||"0").replace(/[^0-9]/g,""))||0;return vb-va;}
      if(sortBy==="budget-lo"){const va=parseInt((a.budget||"0").replace(/[^0-9]/g,""))||0;const vb=parseInt((b.budget||"0").replace(/[^0-9]/g,""))||0;return va-vb;}
      return 0;
    });

  return (
    <div className="page">
      {/* Dark screen header */}
      <div className="screen-header hd-projects">
        <div className="screen-header-bg"/>
        <div className="screen-header-content">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div>
              <div className="screen-header-eyebrow">{role==="church"?"Your Projects":"Browse Projects"}</div>
              <div className="screen-header-title">{role==="church"?"Project Dashboard":"Find Ministry Work"}</div>
              <div className="screen-header-sub">{role==="church"?"Post projects, track bids, and manage your hires.":"Browse open projects from churches across America."}</div>
            </div>
            <div style={{display:"flex",gap:10,flexShrink:0,paddingTop:4}}>
              {role==="church" && <button className="btn-header" onClick={onPost}>Post Project</button>}
              {role==="vendor" && <button className="btn-header" onClick={onMyBids}>My Bids</button>}
            </div>
          </div>
        </div>
      </div>

      <SeasonalAlert role={role} nav={nav||(()=>{})}/>

      {/* Verification nudge */}
      {role==="vendor" && vendorVerified === false && (
        <div onClick={()=>nav("verify-profile")} style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",border:"1px solid rgba(232,224,208,0.12)",borderRadius:12,padding:"14px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.92"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:1}}>Get Faith Verified</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:300}}>Verified vendors win more projects. Takes 3 minutes.</div>
          </div>
          <div style={{padding:"6px 14px",background:"rgba(245,240,232,0.15)",border:"1px solid rgba(245,240,232,0.2)",color:"var(--gold-light)",borderRadius:7,fontSize:11,fontWeight:700,flexShrink:0}}>Apply →</div>
        </div>
      )}

      {/* Search & filters */}
      <div className="board-filters">
        <div className="board-search">
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:0.35,pointerEvents:"none"}}>⌕</span>
          <input placeholder="Search by title, church, or category..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:36}}/>
        </div>
        {["All","Urgent","Open","In Review","Hired"].map(s=>(
          <button key={s} className={`filter-pill${statusFilter===s?" active":""}`} onClick={()=>setStatusFilter(s)}>{s}</button>
        ))}
        {role==="church" && (
          <button className={`filter-pill${myProjectsOnly?" active":""}`} onClick={()=>setMyProjectsOnly(v=>!v)}>Mine Only</button>
        )}
      </div>
      {/* Category + Sort row */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{padding:"6px 10px",borderRadius:7,border:"1.5px solid var(--border)",fontFamily:"DM Sans,sans-serif",fontSize:12,color:"var(--text-mid)",background:"white",outline:"none",cursor:"pointer"}}>
          {cats.map(c=><option key={c} value={c}>{c==="All"?"All Categories":c}</option>)}
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:"6px 10px",borderRadius:7,border:"1.5px solid var(--border)",fontFamily:"DM Sans,sans-serif",fontSize:12,color:"var(--text-mid)",background:"white",outline:"none",cursor:"pointer"}}>
          <option value="newest">Newest First</option>
          <option value="bids">Most Bids</option>
          <option value="budget-hi">Budget: High to Low</option>
          <option value="budget-lo">Budget: Low to High</option>
        </select>
      </div>

      {loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:0,border:"none",borderRadius:0,overflow:"visible",background:"transparent"}}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{padding:"18px 22px",borderRadius:12,border:"1px solid rgba(42,53,32,0.09)",background:"white",marginBottom:8,boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{height:20,width:120,background:"var(--cream-dark)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{height:18,width:60,background:"var(--cream-dark)",borderRadius:100,animation:"skeleton 1.5s ease infinite"}}/>
              </div>
              <div style={{height:16,width:"70%",background:"var(--cream-dark)",borderRadius:6,marginBottom:8,animation:"skeleton 1.5s ease infinite"}}/>
              <div style={{height:13,width:"40%",background:"var(--cream-dark)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:14,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{filtered.length} {filtered.length!==1?"projects":"project"}</div>
          {filtered.length===0 && (
            role==="church" ? (
              <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:16,padding:"48px 40px",textAlign:"center",color:"white"}}>
                <div style={{width:52,height:2,background:"var(--border)",borderRadius:2,margin:"0 auto 18px"}}></div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,marginBottom:10}}>Post your first project</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",marginBottom:28,lineHeight:1.8,maxWidth:480,margin:"0 auto 28px"}}>
                  Describe what you need, set your budget, and receive bids from verified Christian vendors — usually within 24 hours. It's completely free for churches.
                </div>
                <button className="btn-cta" onClick={onPost} style={{padding:"13px 28px",fontSize:14}}>Post a Project — Free →</button>
                <div style={{marginTop:28,display:"flex",gap:0,background:"rgba(255,255,255,0.05)",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden",maxWidth:500,margin:"28px auto 0"}}>
                  {[["Free to post","No credit card needed"],["Bids in 24hrs","Churches average 6+ bids"],["Faith-aligned","Every vendor signed the Covenant"]].map(([title,sub],i)=>(
                    <div key={i} style={{flex:1,padding:"14px 10px",borderRight:i<2?"1px solid rgba(255,255,255,0.08)":"none",textAlign:"center"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",marginBottom:3}}>{title}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{background:"white",borderRadius:12,border:"1px solid rgba(42,53,32,0.09)",padding:"48px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
                <div style={{width:40,height:2,background:"rgba(0,0,0,0.1)",borderRadius:2,margin:"0 auto 16px",opacity:0.4}}></div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:6}}>No projects match your search</div>
                <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:20}}>Try clearing your filters — churches post new projects every day.</div>
                <button className="btn-secondary" onClick={()=>{setSearch("");setStatusFilter("All");}}>Clear Filters</button>
              </div>
            )
          )}
          <div className="project-grid">
            {filtered.map(p=>{
              const accentColor = p.urgent?"var(--danger)":p.status==="hired"?"var(--info)":p.status==="completed"?"var(--success)":p.status==="review"?"var(--warn)":"var(--navy)";
              const isOwn = p.church_id === currentUserId;
              return (
                <div key={p.id} className={`project-card${p.urgent?" urgent":""}${p.status==="hired"?" hired":""}`} onClick={()=>onSelect(p)}>
                  <div className="project-card-inner">
                    <div className="project-card-left" style={{background:accentColor}}/>
                    <div className="project-card-body">
                      <div className="project-card-top-row">
                        <span className="project-cat-badge">{p.category}</span>
                        {statusBadge(p.status, p.urgent)}
                        {isOwn && <span style={{padding:"2px 8px",borderRadius:100,fontSize:9,fontWeight:700,letterSpacing:0.8,background:"rgba(42,53,32,0.06)",color:"var(--text-muted)",textTransform:"uppercase"}}>Yours</span>}
                      </div>
                      <div className="project-card-title">{p.title}</div>
                      <div className="project-card-church">
                        <span>{p.church}</span>
                        {p.city && <><span style={{opacity:0.3}}>·</span><span>{p.city}</span></>}
                      </div>
                      {p.desc && <div className="project-card-desc">{p.desc}</div>}
                      <div className="project-card-meta-row">
                        <span className="project-meta-item">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {p.timeline || "Flexible"}
                        </span>
                        <span className="project-meta-item" style={{color:"var(--text-muted)",fontSize:10}}>{p.posted}</span>
                      </div>
                    </div>
                    <div className="project-card-right">
                      <div>
                        <div className="project-budget-label">Budget</div>
                        <div className="project-budget">{p.budget || "—"}</div>
                      </div>
                      <div className={`bid-count-badge${(p.bids||0)>0?" has-bids":""}`}>
                        {(p.bids||0)>0 && <span className="bid-dot"/>}
                        {p.bids||0} bid{(p.bids||0)!==1?"s":""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectDetail({project:p, role, onBack, onBid, onManageBids, onComplete, onProjectUpdate}){
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [disputeDone, setDisputeDone] = useState(false);
  const [alreadyBid, setAlreadyBid] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({title:p.title||"",desc:p.desc||"",budget:p.budget||"",timeline:p.timeline||"",urgent:p.urgent||false});
  const [editSaving, setEditSaving] = useState(false);

  const saveEdit = async () => {
    if(!editForm.title.trim()||!editForm.desc.trim()) return;
    setEditSaving(true);
    const { error } = await supabase.from("projects").update({
      title: editForm.title,
      description: editForm.desc,
      budget: editForm.budget,
      timeline: editForm.timeline,
      urgent: editForm.urgent,
    }).eq("id", p.id);
    // Also refresh the local bids_count from real data on next board view
    if(!error){
      if(onProjectUpdate) onProjectUpdate({...p,...editForm});
      setEditing(false);
    }
    setEditSaving(false);
  };

  useEffect(()=>{
    if(role!=="vendor"||!p?.id) return;
    supabase.auth.getUser().then(async({data})=>{
      const user = data?.user;
      if(!user) return;
      const {data:existing} = await supabase.from("bids").select("id").eq("project_id",p.id).eq("vendor_id",user.id).maybeSingle();
      setAlreadyBid(!!existing);
    });
  },[p?.id, role]);

  const submitDispute = async () => {
    if (!disputeText.trim()) return;
    await supabase.from("disputes").insert({
      project_id: p.id, title: `Dispute: ${p.title}`, body: disputeText,
      church_name: p.church || "Church", vendor_name: "Vendor",
      amount: p.budget, urgent: false, status: "open",
    }).catch(() => {});
    setDisputeDone(true);
    setShowDispute(false);
  };

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Projects</button>
      <div className="detail-hero">
        <div className="detail-hero-bg"/>
        <div className="detail-hero-content">
          <div className="detail-cat">{p.category}</div>
          <div className="detail-title">{p.title}</div>
          <div className="detail-church">{p.church}</div>
          <div className="detail-meta-row">
            <div className="detail-meta-item"><strong>{p.city}</strong></div>
            <div className="detail-meta-item">{p.budget}</div>
            <div className="detail-meta-item">{p.timeline}</div>
            <div className="detail-meta-item">Posted <strong>{p.posted}</strong></div>
          </div>
        </div>
      </div>

      {/* Edit mode — church only, open projects */}
      {role==="church" && p.status==="open" && editing && (
        <div style={{background:"white",borderRadius:14,border:"1.5px solid var(--border)",padding:"20px 24px",marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:16}}>Edit Project</div>
          <div className="field"><label>Project Title</label><input value={editForm.title} onChange={e=>setEditForm(f=>({...f,title:e.target.value}))}/></div>
          <div className="field"><label>Description</label><textarea value={editForm.desc} onChange={e=>setEditForm(f=>({...f,desc:e.target.value}))} rows={4}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div className="field" style={{marginBottom:0}}><label>Budget</label>
              <select value={editForm.budget} onChange={e=>setEditForm(f=>({...f,budget:e.target.value}))}>
                {["Under $500","$500–$1,000","$1,000–$2,500","$2,500–$5,000","$5,000–$10,000","$10,000–$25,000","$25,000+","Negotiable"].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="field" style={{marginBottom:0}}><label>Timeline</label>
              <select value={editForm.timeline} onChange={e=>setEditForm(f=>({...f,timeline:e.target.value}))}>
                {["Less than 1 week","1–2 weeks","2–4 weeks","1–2 months","2–3 months","3–6 months","6+ months","Ongoing","Flexible"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:14,padding:"11px 14px",background:editForm.urgent?"var(--danger-bg)":"var(--cream)",borderRadius:9,border:`1px solid ${editForm.urgent?"var(--danger-border)":"var(--border)"}`,cursor:"pointer"}} onClick={()=>setEditForm(f=>({...f,urgent:!f.urgent}))}>
            <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${editForm.urgent?"var(--danger)":"var(--border)"}`,background:editForm.urgent?"var(--danger)":"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white"}}>{editForm.urgent?"✓":""}</div>
            <span style={{fontSize:13,fontWeight:600,color:editForm.urgent?"var(--danger)":"var(--text-mid)"}}>Mark as Urgent</span>
          </div>
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <button className="btn-primary" onClick={saveEdit} disabled={editSaving||!editForm.title.trim()}>{editSaving?"Saving...":"Save Changes"}</button>
            <button className="btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {role==="church" && p.status==="open" && !editing && (
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}>
          <button onClick={async()=>{
            if(!window.confirm("Close this project? It will be removed from the board and vendors will no longer be able to bid.")) return;
            const { error } = await supabase.from("projects").update({status:"closed"}).eq("id",p.id);
            if(!error){ if(onProjectUpdate) onProjectUpdate({...p,status:"closed"}); onBack(); }
          }} className="btn-secondary" style={{fontSize:11,padding:"6px 14px",color:"var(--danger)",borderColor:"var(--danger-border)"}}>
            Close Project
          </button>
          <button onClick={()=>setEditing(true)} className="btn-secondary" style={{fontSize:11,padding:"6px 14px"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{marginRight:5}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Project
          </button>
        </div>
      )}

      {p.status === "hired" && role === "church" && !disputeDone && (
        <div style={{background:"linear-gradient(135deg,var(--navy),#1a2e12)",borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:2}}>Project is active</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>Mark complete when work is done to unlock your review.</div>
          </div>
          <div style={{display:"flex",gap:10,flexShrink:0}}>
            <button onClick={()=>setShowDispute(v=>!v)} style={{padding:"8px 14px",border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"var(--danger)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>File Dispute</button>
            <button onClick={()=>onComplete&&onComplete(p.id)} style={{padding:"8px 18px",background:"linear-gradient(135deg,var(--gold),var(--gold-light))",color:"var(--navy)",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Mark Complete</button>
          </div>
        </div>
      )}

      {showDispute && (
        <div style={{background:"white",borderRadius:14,border:"1.5px solid var(--danger-border)",padding:"20px",marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:8}}>File a Dispute</div>
          <textarea value={disputeText} onChange={e=>setDisputeText(e.target.value)} rows={4} style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid rgba(42,53,32,0.12)",fontFamily:"DM Sans,sans-serif",fontSize:13,outline:"none",marginBottom:10,resize:"vertical"}} placeholder="Describe the issue..."/>
          <div style={{display:"flex",gap:10}}>
            <button onClick={submitDispute} disabled={!disputeText.trim()} className="btn-primary" style={{fontSize:12,padding:"8px 18px"}}>Submit</button>
            <button onClick={()=>setShowDispute(false)} className="btn-secondary" style={{fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {disputeDone && (
        <div style={{background:"var(--warn-bg)",border:"1px solid var(--warn-border)",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:12,color:"var(--warn)",fontWeight:600}}>
          Dispute filed — our team will review within 48 hours.
        </div>
      )}

      {p.status === "completed" && (
        <div style={{background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:13,fontWeight:600,color:"var(--success)"}}>
          Project complete. Thank you!
        </div>
      )}

      <div className="detail-layout">
        <div>
          <div className="card">
            <div className="card-body">
              <div className="detail-section">
                <div className="detail-section-title">Project Description</div>
                <div className="detail-body">{p.desc}</div>
              </div>
              {(p.requirements||[]).length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-title">Requirements</div>
                  <ul className="req-list">{(p.requirements||[]).map((r,i)=><li key={i} className="req-item"><div className="req-bullet"/>{r}</li>)}</ul>
                </div>
              )}
              {(p.skills||[]).length > 0 && (
                <div className="detail-section" style={{marginBottom:0}}>
                  <div className="detail-section-title">Skills Needed</div>
                  <div className="skill-tags">{(p.skills||[]).map(s=><span key={s} className="skill-tag">{s}</span>)}</div>
                </div>
              )}
            </div>
          </div>

          {/* ── MILESTONE TRACKER — actionable for church, visible for vendor ── */}
          {(p.status === "hired" || p.status === "completed") && (
            <MilestoneTracker project={p} role={role} />
          )}
        </div>
        <div className="bid-panel">
          <div className="bid-panel-hd">
            <div className="bid-panel-title">{role==="vendor"?"Submit Your Bid":"Bids Received"}</div>
            <div className="bid-panel-sub">{p.bids||0} vendor{p.bids!==1?"s have":"has"} bid on this project</div>
          </div>
          <div className="bid-panel-body">
            <div className="bid-stat-row">
              <div className="bid-stat"><div className="bid-stat-num">{p.bids||0}</div><div className="bid-stat-label">Total Bids</div></div>
              <div className="bid-stat"><div className="bid-stat-num">{(p.budget||"").split("–")[0]||"—"}</div><div className="bid-stat-label">Budget From</div></div>
            </div>
            {role==="vendor" && p.status==="open" && !alreadyBid && <button className="bid-cta bid-cta-primary" onClick={onBid}>Submit Your Bid →</button>}
            {role==="vendor" && p.status==="open" && alreadyBid && <div style={{padding:"12px 14px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:8,fontSize:12,color:"var(--success)",fontWeight:600,textAlign:"center"}}>✓ You've already submitted a bid</div>}
            {role==="vendor" && p.status==="hired" && <div style={{padding:"10px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:8,fontSize:12,color:"var(--info)",fontWeight:600,textAlign:"center"}}>A vendor has been hired</div>}
            {role==="church" && p.status!=="completed" && <button className="bid-cta bid-cta-primary" onClick={onManageBids}>Review All Bids</button>}
            {p.status==="open" && <div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 11px",background:"var(--warn-bg)",border:"1px solid var(--warn-border)",borderRadius:8,fontSize:12,color:"var(--warn)",fontWeight:500,marginTop:10}}>Bids open</div>}
          </div>
          {/* Church public profile — helps vendors research before bidding */}
          {role==="vendor" && p.church && (
            <div style={{margin:"0 0 0",borderTop:"1px solid var(--border)",padding:"16px 20px"}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10}}>About This Church</div>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,var(--navy),var(--navy-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,color:"white",letterSpacing:0.5}}>CH</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:3}}>{p.church}</div>
                  {p.city && <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:3}}>{p.city}</div>}
                  {p.denomination && <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:3}}>✦ {p.denomination}</div>}
                  <div style={{fontSize:11,color:"var(--text-muted)"}}>Posted {p.posted}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MILESTONE TRACKER — actionable
══════════════════════════════════ */
function MilestoneTracker({project:p, role}){
  const [milestones, setMilestones] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(()=>{
    // Try to load milestones from the hired bid's milestones field
    const loadMilestones = async () => {
      const { data: bid } = await supabase
        .from("bids")
        .select("milestones, amount, vendor_name")
        .eq("project_id", p.id)
        .eq("status","hired")
        .maybeSingle();
      if (bid?.milestones && Array.isArray(bid.milestones) && bid.milestones.length > 0) {
        setMilestones(bid.milestones.map((m,i)=>({
          ...m,
          id: i,
          status: m.status || (i===0?"active":"todo"),
          vendorName: bid.vendor_name,
          totalAmount: bid.amount,
        })));
      } else {
        // Fallback default milestones
        setMilestones([
          {id:0, desc:"Discovery & Kickoff",    pct:25, status:"done"},
          {id:1, desc:"Delivery & Review",       pct:50, status:"active"},
          {id:2, desc:"Final Handoff",           pct:25, status:"todo"},
        ]);
      }
    };
    loadMilestones();
  },[p.id]);

  const showLocalToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2500); };

  const approveMilestone = async (idx) => {
    const updated = milestones.map((m,i)=>{
      if (i===idx) return {...m, status:"done"};
      if (i===idx+1 && m.status==="todo") return {...m, status:"active"};
      return m;
    });
    setMilestones(updated);
    // Persist updated milestone statuses to the bid
    const { data: bid } = await supabase.from("bids").select("id").eq("project_id",p.id).eq("status","hired").maybeSingle();
    if (bid) {
      await supabase.from("bids").update({ milestones: updated }).eq("id", bid.id).catch(()=>{});
    }
    showLocalToast("Milestone approved — payment released");
  };

  const requestApproval = async (idx) => {
    const m = milestones[idx];
    // Get the hired bid and project info to find the church
    const { data: bid } = await supabase.from("bids").select("id, project_id, vendor_name").eq("project_id", p.id).eq("status","hired").maybeSingle();
    if (bid) {
      const { data: proj } = await supabase.from("projects").select("church_id, title").eq("id", bid.project_id).maybeSingle();
      if (proj?.church_id) {
        await supabase.from("notifications").insert({
          user_id: proj.church_id,
          type: "milestone",
          title: "Milestone ready for approval",
          body: `${bid.vendor_name || "Your vendor"} has completed "${m.desc||`Milestone ${idx+1}`}" on "${proj.title}" and is requesting your approval.`,
          link: "projects",
          read: false,
          created_at: new Date().toISOString(),
        }).catch(()=>{});
      }
      // Mark the milestone as "awaiting" locally
      setMilestones(prev => prev.map((x,i) => i===idx ? {...x, awaiting:true} : x));
    }
    showLocalToast("✓ Approval request sent to church");
  };

  const doneCount = milestones.filter(m=>m.status==="done").length;
  const totalPct = milestones.filter(m=>m.status==="done").reduce((a,m)=>a+(Number(m.pct)||0),0);

  return (
    <div className="card" style={{marginTop:16}}>
      <div className="card-hd" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div className="card-hd-title">Payment Milestones</div>
        <div style={{fontSize:11,color:"var(--text-muted)",fontWeight:500}}>{doneCount}/{milestones.length} complete · {totalPct}% released</div>
      </div>
      <div className="card-body" style={{padding:"0"}}>
        {/* Progress bar */}
        <div style={{height:4,background:"var(--cream-dark)",margin:"0"}}>
          <div style={{height:"100%",width:`${totalPct}%`,background:"linear-gradient(90deg,var(--success),#4ade80)",transition:"width 0.6s ease",borderRadius:"0 2px 2px 0"}}/>
        </div>
        <div style={{padding:"12px 20px"}}>
          {milestones.map((m,i)=>(
            <div key={m.id??i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:i<milestones.length-1?"1px solid var(--border)":"none"}}>
              {/* Status dot */}
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
                background:m.status==="done"?"var(--success-bg)":m.status==="active"?"var(--warn-bg)":"var(--cream-dark)",
                border:`2px solid ${m.status==="done"?"var(--success)":m.status==="active"?"var(--warn)":"var(--border)"}`,
                color:m.status==="done"?"var(--success)":m.status==="active"?"var(--warn)":"var(--text-muted)"}}>
                {m.status==="done"?"✓":m.status==="active"?"●":"○"}
              </div>
              {/* Label */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:m.status==="done"?"var(--text-muted)":"var(--navy)",textDecoration:m.status==="done"?"line-through":"none",marginBottom:2}}>{m.desc||`Milestone ${i+1}`}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{m.pct}% of project value</div>
              </div>
              {/* Action */}
              <div style={{flexShrink:0}}>
                {m.status==="done" && <span style={{fontSize:11,fontWeight:600,color:"var(--success)",padding:"4px 10px",background:"var(--success-bg)",borderRadius:100}}>✓ Released</span>}
                {m.status==="active" && role==="church" && (
                  <button onClick={()=>approveMilestone(i)} style={{padding:"7px 14px",background:"var(--navy)",color:"white",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s"}}>
                    Approve & Release
                  </button>
                )}
                {m.status==="active" && role==="vendor" && (
                  <button onClick={()=>requestApproval(i)} style={{padding:"7px 14px",background:"var(--gold-pale)",color:"var(--gold-text)",border:"1px solid rgba(232,224,208,0.4)",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                    Request Approval
                  </button>
                )}
                {m.status==="todo" && <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:500}}>Pending</span>}
              </div>
            </div>
          ))}
        </div>
        {toast && <div style={{margin:"0 20px 16px",padding:"10px 14px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:9,fontSize:12,color:"var(--success)",fontWeight:600}}>{toast}</div>}
      </div>
    </div>
  );
}

function PostProject({onSubmit, onBack}){
  const [step, setStep] = useState(1);
  const STEPS = ["Format","Category","Details","Budget","Review"];
  const [form, setForm] = useState(()=>{
    try {
      const saved = localStorage.getItem("kb_draft_project");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {format:"",category:"",icon:"",title:"",desc:"",requirements:"",skills:[],scope:"",budget:"",timeline:"",urgent:false};
  });
  const [skillInput, setSkillInput] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const set = (k,v) => setForm(f=>{
    const next = {...f,[k]:v};
    try {
      localStorage.setItem("kb_draft_project", JSON.stringify(next));
      setDraftSaved(true);
      setTimeout(()=>setDraftSaved(false), 1500);
    } catch {}
    return next;
  });
  const addSkill = (e)=>{if((e.key==="Enter"||e.key===",")&&skillInput.trim()){e.preventDefault();if(!form.skills.includes(skillInput.trim()))set("skills",[...form.skills,skillInput.trim()]);setSkillInput("");}};
  const removeSkill = (s) => set("skills",form.skills.filter(x=>x!==s));
  const canNext = ()=>{if(step===1)return!!form.format;if(step===2)return!!form.category;if(step===3)return form.title.length>5&&form.desc.length>10&&!!form.scope;if(step===4)return!!form.budget&&!!form.timeline;return true;};
  const submit = ()=>{
    try { localStorage.removeItem("kb_draft_project"); } catch {}
    onSubmit({...form,requirements:form.requirements.split("\n").filter(Boolean),skills:form.skills.length?form.skills:["General Skills"]});
  };
  const clearDraft = ()=>{
    try { localStorage.removeItem("kb_draft_project"); } catch {}
    setForm({format:"",category:"",icon:"",title:"",desc:"",requirements:"",skills:[],scope:"",budget:"",timeline:"",urgent:false});
    setStep(1);
  };
  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Projects</button>
      <div className="page-hd">
        <div><div className="eyebrow">Post a Project</div><h1 className="page-title">Tell vendors what you need</h1></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:12,color:"var(--text-muted)",fontWeight:500}}>Step {step} of {STEPS.length}</div>
          {draftSaved && <div style={{fontSize:11,color:"var(--success)",fontWeight:500,display:"flex",alignItems:"center",gap:4}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Draft saved</div>}
          {step===1 && (()=>{try{return localStorage.getItem("kb_draft_project")?<button onClick={clearDraft} style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Clear draft ×</button>:null}catch{return null}})()}
        </div>
      </div>
      <div className="step-bar">
        {STEPS.map((s,i)=>(
          <div key={s} className="step-item">
            <div className={`step-circle${step===i+1?" active":step>i+1?" done":""}`}>{step>i+1?"✓":i+1}</div>
            <span className={`step-label${step===i+1?" active":step>i+1?" done":""}`}>{s}</span>
            {i<STEPS.length-1 && <div className={`step-line${step>i+1?" done":""}`}/>}
          </div>
        ))}
      </div>
      <div style={{maxWidth:640}}>
        {step===1 && (
          <div className="card">
            <div className="card-hd"><div className="card-hd-title">How will this project be delivered?</div></div>
            <div className="card-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {id:"in-person", label:"In Person", sub:"The vendor comes to your location — construction, AV setup, photography, events, etc."},
                  {id:"virtual",   label:"Online / Virtual", sub:"Work delivered remotely — web design, graphic design, consulting, marketing, music production, etc."},
                ].map(opt=>(
                  <div
                    key={opt.id}
                    onClick={()=>set("format", opt.id)}
                    style={{
                      padding:"24px 20px",borderRadius:12,cursor:"pointer",
                      border:`2px solid ${form.format===opt.id?"var(--navy)":"var(--border)"}`,
                      background:form.format===opt.id?"var(--cream)":"white",
                      transition:"all 0.2s",position:"relative",
                    }}
                  >
                    {form.format===opt.id && <div style={{position:"absolute",top:12,right:12,width:18,height:18,borderRadius:"50%",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:"white"}}/>
                    </div>}
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:17,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{opt.label}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6,fontWeight:300}}>{opt.sub}</div>
                  </div>
                ))}
              </div>
              {form.format && (
                <div style={{marginTop:16,padding:"11px 14px",background:"var(--cream)",borderRadius:8,border:"1px solid var(--border)",fontSize:12,color:"var(--text-mid)"}}>
                  {form.format==="in-person"
                    ? "Vendors will see your city and come to your location. Make sure to include your general area in the project details."
                    : "Vendors anywhere in the country can bid. Perfect for digital services — no location restrictions."}
                </div>
              )}
            </div>
          </div>
        )}
        {step===2 && (
          <div className="card"><div className="card-hd"><div className="card-hd-title">What type of service do you need?</div></div>
            <div className="card-body"><div className="option-grid">
              {CATEGORIES.map(c=>(
                <div key={c.label} className={`option-card${form.category===c.label?" selected":""}`} onClick={()=>{set("category",c.label);set("icon",c.icon);}}>
                  <div className="option-label" style={{fontSize:12}}>{c.label}</div>
                </div>
              ))}
            </div></div>
          </div>
        )}
        {step===3 && (
          <div className="card"><div className="card-hd"><div className="card-hd-title">Project Details</div></div>
            <div className="card-body">
              <div className="field"><label>Project Title</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder={`e.g. ${form.icon} Complete ${form.category} for our church`}/></div>
              <div className="field"><label>Description</label><textarea value={form.desc} onChange={e=>set("desc",e.target.value)} rows={4} placeholder="Describe exactly what you need..."/></div>
              <div className="field"><label>Requirements (one per line)</label><textarea value={form.requirements} onChange={e=>set("requirements",e.target.value)} rows={3} placeholder={"Licensed and insured\nMust have church experience"}/></div>
              <div className="field"><label>Skills Needed — press Enter to add</label>
                <div className="tags-wrap">
                  {form.skills.map(s=><div key={s} className="tag-chip">{s}<button className="tag-chip-x" onClick={()=>removeSkill(s)}>×</button></div>)}
                  <input className="tags-input" value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={addSkill} placeholder={form.skills.length?"":"Type a skill and press Enter..."}/>
                </div>
              </div>
              <div className="field"><label>Project Scope</label>
                <div className="option-grid">
                  {["One-time project","Ongoing work","Quick task","Large project"].map(s=>(
                    <div key={s} className={`option-card${form.scope===s?" selected":""}`} onClick={()=>set("scope",s)}>
                      <div className="option-label">{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {step===4 && (
          <div className="card"><div className="card-hd"><div className="card-hd-title">Budget & Timeline</div></div>
            <div className="card-body">
              <div className="field"><label>Budget Range</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
                  {BUDGETS.map(b=><div key={b} className={`option-card${form.budget===b?" selected":""}`} style={{padding:"9px 11px",textAlign:"left"}} onClick={()=>set("budget",b)}><div style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{b}</div></div>)}
                </div>
              </div>
              <div className="field" style={{marginTop:16}}><label>Timeline</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
                  {TIMELINES.map(t=><div key={t} className={`option-card${form.timeline===t?" selected":""}`} style={{padding:"9px 11px",textAlign:"left"}} onClick={()=>set("timeline",t)}><div style={{fontSize:12,fontWeight:500,color:"var(--navy)"}}>{t}</div></div>)}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:11,padding:"12px 14px",background:form.urgent?"var(--danger-bg)":"var(--cream)",border:`1px solid ${form.urgent?"var(--danger-border)":"var(--border)"}`,borderRadius:9,cursor:"pointer",marginTop:16}} onClick={()=>set("urgent",!form.urgent)}>
                <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.urgent?"var(--danger)":"var(--border)"}`,background:form.urgent?"var(--danger)":"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white"}}>{form.urgent?"✓":""}</div>
                <div><div style={{fontSize:13,fontWeight:600}}>Mark as Urgent</div><div style={{fontSize:11,color:"var(--text-muted)"}}>Highlights your project at the top of the board</div></div>
              </div>
            </div>
          </div>
        )}
        {step===5 && (
          <div className="card"><div className="card-hd"><div className="card-hd-title">Review & Post</div></div>
            <div className="card-body">
              <div style={{background:"var(--navy)",borderRadius:11,padding:"18px 22px",marginBottom:18}}>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",background:"rgba(232,224,208,0.15)",border:"1px solid rgba(232,224,208,0.3)",borderRadius:100,fontSize:10,fontWeight:600,color:"var(--gold-light)"}}>{form.format==="virtual"?"Online / Virtual":"In Person"}</div>
                  <div style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",background:"rgba(232,224,208,0.08)",border:"1px solid rgba(232,224,208,0.2)",borderRadius:100,fontSize:10,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>{form.category}</div>
                </div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:18,fontWeight:700,color:"white",marginBottom:7}}>{form.title||"Your Project Title"}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{form.desc.slice(0,120)}{form.desc.length>120?"...":""}</div>
                <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap"}}>
                  {[{icon:"",val:form.budget},{icon:"",val:form.timeline}].map((m,i)=><div key={i} style={{fontSize:12,color:"rgba(255,255,255,0.55)",display:"flex",alignItems:"center",gap:4}}>{m.icon} <strong style={{color:"white"}}>{m.val}</strong></div>)}
                </div>
              </div>
              <div style={{padding:"12px 14px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:9,fontSize:13,color:"var(--success)"}}>
                ✓ Your project will be posted publicly. Posting is <strong>100% free</strong>.
              </div>
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:10,alignItems:"center",marginTop:16}}>
          {step>1
            ? <button className="btn-secondary" onClick={()=>setStep(s=>s-1)}>← Back</button>
            : <button className="btn-secondary" onClick={onBack}>← Back</button>
          }
          {step<5
            ? <button className="btn-primary" onClick={()=>{if(canNext())setStep(s=>s+1);}} style={{opacity:canNext()?1:0.5}}>Continue</button>
            : <button className="btn-primary" onClick={submit}>Post My Project — Free</button>
          }
        </div>
      </div>
    </div>
  );
}

function BidForm({project:p, onBack, onSubmit}){
  const [amount, setAmount] = useState(()=>{
    if (!p?.budget) return 3500;
    // Parse budget range like "$2,500–$5,000" or "$25,000+" 
    const nums = (p.budget || "").replace(/[$,+]/g,"").split(/[–\-–]/);
    const lo = parseInt(nums[0]) || 0;
    const hi = parseInt(nums[1]) || lo;
    const mid = hi > 0 ? Math.round((lo + hi) / 2 / 100) * 100 : lo || 3500;
    return Math.max(500, Math.min(50000, mid || 3500));
  });
  const [cover, setCover] = useState("");
  const [timeline, setTimeline] = useState("");
  const [milestones, setMilestones] = useState([
    {desc:"Initial concepts & discovery",pct:25},
    {desc:"Development & build",pct:50},
    {desc:"Final delivery & revisions",pct:25},
  ]);
  const updateM = (i,k,v) => setMilestones(m=>{
    const updated = m.map((x,idx)=>idx===i?{...x,[k]:v}:x);
    // Auto-balance: when changing pct, redistribute remainder equally among others
    if (k==="pct" && updated.length > 1) {
      const newPct = Math.max(0, Math.min(100, Number(v)||0));
      const rest = 100 - newPct;
      const others = updated.filter((_,idx)=>idx!==i);
      const perOther = Math.floor(rest / others.length);
      let overflow = rest - perOther * others.length;
      return updated.map((x,idx)=>{
        if (idx===i) return {...x,pct:newPct};
        const base = perOther + (overflow-->0?1:0);
        return {...x,pct:Math.max(0,base)};
      });
    }
    return updated;
  });
  const totalPct = milestones.reduce((a,m)=>a+Number(m.pct),0);
  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Project</button>
      <div className="page-hd">
        <div><div className="eyebrow">Submit a Bid</div><h1 className="page-title">Bid on: {p?.title}</h1><p className="page-sub">{p?.church}{p?.city ? ` · ${p.city}` : ""} · {p?.budget}</p></div>
      </div>
      <div style={{maxWidth:700}}>
        <div className="card"><div className="card-hd"><div className="card-hd-title">Your Bid Amount</div></div>
          <div className="card-body">
            <div style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"var(--navy)",textAlign:"center",padding:"16px",background:"var(--cream)",borderRadius:10,marginBottom:8}}>${amount.toLocaleString()}</div>
            <input type="range" min={500} max={50000} step={100} value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{width:"100%",accentColor:"var(--gold)"}}/>
            <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap"}}>
              {(p?.budget?.includes("25,000")||p?.budget?.includes("10,000")||p?.budget?.includes("+") ? [2500,5000,10000,15000,25000,50000] : [1500,2500,3500,5000,7500,10000]).map(v=>(
                <button key={v} className="btn-ghost" style={{fontSize:12,padding:"5px 11px",background:amount===v?"var(--gold-pale)":"white",borderColor:amount===v?"var(--gold)":"var(--border)",color:amount===v?"var(--gold)":"var(--text-muted)"}} onClick={()=>setAmount(v)}>${v.toLocaleString()}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="card"><div className="card-hd"><div className="card-hd-title">Payment Milestones</div><button className="btn-ghost" onClick={()=>setMilestones(m=>[...m,{desc:"",pct:0}])}>+ Add</button></div>
          <div className="card-body">
            {milestones.map((m,i)=>(
              <div key={i} className="milestone-row">
                <div className="milestone-num">{i+1}</div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <input className="milestone-input" value={m.desc} onChange={e=>updateM(i,"desc",e.target.value)} placeholder="Milestone description..."/>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <input className="milestone-input" type="number" value={m.pct} onChange={e=>updateM(i,"pct",e.target.value)} style={{width:60}}/>
                    <span style={{fontSize:12,color:"var(--text-muted)"}}>% = ${Math.round(amount*m.pct/100).toLocaleString()}</span>
                  </div>
                </div>
                {milestones.length>1 && <button style={{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:16}} onClick={()=>setMilestones(m=>m.filter((_,idx)=>idx!==i))}>×</button>}
              </div>
            ))}
            <div style={{fontSize:12,color:totalPct===100?"var(--success)":"var(--danger)",marginTop:6,fontWeight:600}}>{totalPct}% allocated {totalPct===100?"✓":"— must equal 100%"}</div>
          </div>
        </div>
        <div className="card"><div className="card-hd"><div className="card-hd-title">Cover Letter</div></div>
          <div className="card-body">
            <div className="field">
              <label>Why are you the right fit for this ministry?</label>
              <textarea value={cover} onChange={e=>setCover(e.target.value)} rows={5} placeholder="Introduce yourself, your relevant church experience, and how your faith shapes your work..."/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <div style={{fontSize:11,color:cover.length<80?"var(--danger)":cover.length<200?"var(--warn)":"var(--success)"}}>{cover.length<80?`${80-cover.length} more characters for a strong bid`:cover.length<200?"Good start — add more detail":"Strong cover letter ✓"}</div>
                <div className="char-count">{cover.length}/1000</div>
              </div>
            </div>
            <div className="field"><label>Estimated Timeline</label>
              <select value={timeline} onChange={e=>setTimeline(e.target.value)}>
                <option value="">Select your timeline...</option>
                {TIMELINES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button className="btn-primary" disabled={!timeline||!cover.trim()||totalPct!==100} onClick={()=>onSubmit({amount, cover, timeline, milestones})} style={{padding:"13px 28px",opacity:(!timeline||!cover.trim()||totalPct!==100)?0.5:1}}>Submit Bid — ${amount.toLocaleString()}</button>
          <button className="btn-secondary" onClick={onBack}>Cancel</button>
          {(!timeline||!cover.trim()||totalPct!==100) && <span style={{fontSize:11,color:"var(--text-muted)"}}>{totalPct!==100?"Milestones must total 100%":!cover.trim()?"Add a cover letter":"Select a timeline"}</span>}
        </div>
      </div>
    </div>
  );
}

function ManageBids({project:p, bids, loading, onAccept, onDecline, onBack, onNav}){
  const [expanded, setExpanded] = useState(null);
  const lowest = bids.length > 0 ? Math.min(...bids.map(b=>b.amount)) : 0;
  const hired = bids.find(b=>b.hired);
  const avgBid = bids.length > 0 ? Math.round(bids.reduce((a,b)=>a+b.amount,0)/bids.length) : 0;
  const avgRating = bids.length > 0 ? (bids.reduce((a,b)=>a+b.rating,0)/bids.length).toFixed(1) : "—";
  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Projects</button>
      <div className="page-hd">
        <div><div className="eyebrow">Bid Management</div><h1 className="page-title">{p.title}</h1><p className="page-sub">{bids.length} bids received · Budget: {p.budget}</p></div>
        {hired && (
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          <div style={{padding:"9px 14px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:9,fontSize:13,color:"var(--success)",fontWeight:500}}>✓ Hired: {hired.vendor}</div>
        </div>
      )}
      </div>
      <div style={{display:"flex",gap:0,background:"white",border:"1px solid rgba(42,53,32,0.09)",borderRadius:12,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
        {[{label:"Total Bids",value:bids.length},{label:"Lowest Bid",value:bids.length>0?`$${lowest.toLocaleString()}`:"—"},{label:"Avg Bid",value:bids.length>0?`$${avgBid.toLocaleString()}`:"—"},{label:"Avg Rating",value:avgRating==="—"?"—":avgRating+"★"}].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"14px 18px",borderRight:i<3?"1px solid var(--border)":"none",textAlign:"center"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"var(--navy)"}}>{s.value}</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>
      {hired && (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:12,padding:"18px 22px",marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:12}}>What happens next</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {num:"01",title:"Check your messages",body:`A conversation with ${hired.vendor} has been started automatically.`},
              {num:"02",title:"Track milestones",body:"Open the project to approve milestone payments as work is delivered."},
              {num:"03",title:"Leave a review",body:"When the project wraps, rate your vendor to help the community."},
            ].map((s,i)=>(
              <div key={i} style={{padding:"12px 14px",background:"rgba(255,255,255,0.06)",borderRadius:9,border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:6,letterSpacing:1}}>{s.num}</div>
                <div style={{fontSize:12,fontWeight:700,color:"white",marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",lineHeight:1.5,fontWeight:300}}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && <div style={{textAlign:"center",padding:"40px",color:"var(--text-muted)",fontSize:14}}>Loading bids...</div>}
      {!loading && bids.length === 0 && (
        <div style={{background:"white",borderRadius:12,border:"1px solid rgba(42,53,32,0.09)",padding:"48px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
          <div style={{width:48,height:48,borderRadius:12,background:"var(--cream-dark)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={{fontSize:16,fontWeight:700,color:"var(--navy)",marginBottom:8}}>Waiting for bids</div>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24,lineHeight:1.7,maxWidth:440,margin:"0 auto 24px"}}>
            Vendors are notified when projects go live. Most projects receive their first bid within a few hours. Make sure your project description includes budget, timeline, and specific requirements.
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <div style={{padding:"14px 20px",background:"white",borderRadius:10,border:"1px solid var(--border)",textAlign:"left",maxWidth:200}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Get more bids</div>
              <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.5}}>Add specific skills, a clear budget range, and a realistic timeline.</div>
            </div>
            <div style={{padding:"14px 20px",background:"white",borderRadius:10,border:"1px solid var(--border)",textAlign:"left",maxWidth:200}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--navy)",marginBottom:4}}>✦ Verified first</div>
              <div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.5}}>Faith Verified vendors are the most active bidders on the platform.</div>
            </div>
          </div>
        </div>
      )}
      {!loading && bids.length > 0 && <div className="card">
        <div className="card-hd"><div className="card-hd-title">All Bids — Comparison View</div></div>
        <table className="bids-table">
          <thead><tr><th style={{padding:"10px 14px 8px"}}>Vendor</th><th style={{padding:"10px 14px 8px"}}>Amount</th><th style={{padding:"10px 14px 8px"}}>Timeline</th><th style={{padding:"10px 14px 8px"}}>Rating</th><th style={{padding:"10px 14px 8px"}}>Actions</th></tr></thead>
          <tbody>
            {bids.map(b=>(
              <React.Fragment key={b.id}>
                <tr style={{background:b.amount===lowest&&!b.declined?"var(--gold-pale)":"white",opacity:b.declined?0.4:1}}>
                  <td style={{padding:"11px 14px"}}>
                    <div className="vendor-mini">
                      <div className="vendor-mini-avatar" style={{fontSize:12,fontWeight:700,letterSpacing:0.5}}>{b.vendor?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className="vendor-mini-name">{b.vendor}{b.amount===lowest&&!b.declined&&<span className="badge-best">★ Lowest</span>}{b.hired&&<span className="badge-best" style={{background:"var(--success)"}}>Hired</span>}</div>
                        <div className="vendor-mini-cat">{b.category}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"11px 14px"}}><div className="bid-amount-cell">${b.amount.toLocaleString()}</div></td>
                  <td style={{padding:"11px 14px",fontSize:12,color:"var(--text-mid)"}}>{b.timeline}</td>
                  <td style={{padding:"11px 14px"}}><span style={{color:"var(--gold)",fontSize:12}}>{"★".repeat(Math.floor(b.rating))}</span> <span style={{fontSize:12,fontWeight:600}}>{b.rating}</span></td>
                  <td style={{padding:"11px 14px"}}>
                    {!b.hired&&!b.declined?(
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button className="btn-accept" onClick={()=>onAccept(b.id)}>✓ Hire</button>
                        <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={async(e)=>{
                          e.stopPropagation();
                          try {
                            const vendorObj = {id:b.vendor_id,name:b.vendor,category:b.category,emoji:"",user_id:b.vendor_id};
                            await startConversation(vendorObj, onNav||(() => {}));
                          } catch(err) { console.error(err); }
                        }}>Message</button>
                        <button className="btn-ghost" style={{fontSize:11,padding:"5px 10px"}} onClick={()=>setExpanded(expanded===b.id?null:b.id)}>Details</button>
                        <button className="btn-decline-sm" onClick={()=>onDecline(b.id)}>✕</button>
                      </div>
                    ):<span style={{fontSize:12,fontWeight:500,color:b.hired?"var(--success)":"var(--text-muted)"}}>{b.hired?"Hired":"Declined"}</span>}
                  </td>
                </tr>
                {expanded===b.id&&(
                  <tr>
                    <td colSpan={5} style={{background:"var(--cream)",padding:"14px 18px"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--navy)",marginBottom:6}}>Cover Letter</div>
                      <div style={{fontSize:13,color:"var(--text-mid)",lineHeight:1.7,fontStyle:"italic",fontWeight:300}}>"{b.note}"</div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

/* ══════════════════════════════════
   MY BIDS SCREEN (vendor view)
══════════════════════════════════ */
function MyBidsScreen({bids, loading, onBack}){
  const [localBids, setLocalBids] = useState(bids);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(()=>{ setLocalBids(bids); },[bids]);

  const handleWithdraw = async (bidId) => {
    if(!window.confirm("Withdraw this bid? This cannot be undone.")) return;
    setWithdrawing(bidId);
    const { error } = await supabase.from("bids").delete().eq("id", bidId);
    if(!error) setLocalBids(prev => prev.filter(b => b.id !== bidId));
    setWithdrawing(null);
  };
  const STATUS_COLORS = {
    pending:    {bg:"var(--warn-bg)",    color:"var(--warn)",    border:"var(--warn-border)",    label:"Pending"},
    hired:      {bg:"var(--success-bg)", color:"var(--success)", border:"var(--success-border)", label:"Hired"},
    declined:   {bg:"var(--danger-bg)",  color:"var(--danger)",  border:"var(--danger-border)",  label:"Declined"},
  };
  const active  = localBids.filter(b => b.status === "pending");
  const won     = localBids.filter(b => b.status === "hired");
  const lost    = localBids.filter(b => b.status === "declined");

  return (
    <div className="page">
      <div className="screen-header">
        <div className="screen-header-content">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div>
              <button className="btn-back-light" onClick={onBack}>← Back to Projects</button>
              <div className="screen-header-eyebrow">Your Activity</div>
              <div className="screen-header-title">My Bids</div>
              <div className="screen-header-sub">Track every proposal you've submitted and your win rate.</div>
            </div>
            <div style={{display:"flex",gap:16,flexShrink:0,paddingTop:28}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"white",lineHeight:1}}>{localBids.length}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>Total</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"rgba(34,197,94,0.9)",lineHeight:1}}>{won.length}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>Won</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--gold-light)",lineHeight:1}}>{bids.length>0?Math.round(won.length/bids.length*100)+"%":"—"}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:1,textTransform:"uppercase",marginTop:3}}>Win Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Earnings summary */}
      {won.length > 0 && (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:6}}>Revenue via KingdomBid</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"white",lineHeight:1}}>
              ${won.reduce((sum,b)=>sum+(Number(b.amount)||0),0).toLocaleString()}
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4}}>Across {won.length} won project{won.length!==1?"s":""}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:2,fontStyle:"italic"}}>Total of accepted bid amounts</div>
          </div>
          {/* Win streak */}
          {(()=>{
            const sorted = [...bids].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
            let streak = 0;
            for(const b of sorted){ if(b.status==="hired") streak++; else break; }
            return streak > 1 ? (
              <div style={{textAlign:"center",padding:"12px 20px",background:"rgba(245,240,232,0.08)",borderRadius:10,border:"1px solid rgba(245,240,232,0.15)"}}>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"var(--gold-light)",lineHeight:1}}>{streak}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4,fontWeight:600,letterSpacing:0.5}}>WIN STREAK</div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Referral nudge */}
      <div style={{background:"linear-gradient(135deg,var(--navy),#1a2e12)",borderRadius:12,border:"none",padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"white",marginBottom:2}}>Earn $50 in credit</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.55)"}}>Refer a church or vendor — when they land their first gig, you get $50 in account credit.</div>
        </div>
        <button style={{background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:7,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",whiteSpace:"nowrap"}} onClick={async()=>{
          const { data:{user} } = await supabase.auth.getUser().catch(()=>({data:{user:null}}));
          const link = user ? `https://kingdombid.com/join?ref=${user.id.slice(0,8)}` : "https://kingdombid.com/join";
          try { await navigator.clipboard.writeText(link); } catch(e) {}
        }}>Copy Referral Link</button>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>Loading your bids...</div>
      ) : localBids.length === 0 ? (
        <div style={{background:"linear-gradient(135deg,var(--navy),var(--navy-light))",borderRadius:16,padding:"48px 40px",textAlign:"center",color:"white"}}>
          <div style={{width:52,height:2,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 18px"}}></div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,marginBottom:10}}>Your first bid is the hardest one</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",marginBottom:28,lineHeight:1.8,maxWidth:440,margin:"0 auto 28px"}}>
            Browse open projects, find one that fits your skills, and write a personal cover letter. Churches here are actively looking to hire Christian vendors — they're rooting for you.
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            <button className="btn-cta" onClick={onBack} style={{padding:"12px 24px",fontSize:13}}>Browse Open Projects</button>
          </div>
          <div style={{display:"flex",gap:0,background:"rgba(255,255,255,0.05)",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden",maxWidth:480,margin:"0 auto"}}>
            {[["Complete your profile","Stand out instantly"],["Write a faith statement","Win more bids"],["Get Faith Verified","Top trust signal on the platform"]].map(([title,sub],i)=>(
              <div key={i} style={{flex:1,padding:"16px 12px",borderRight:i<2?"1px solid rgba(255,255,255,0.08)":"none",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",marginBottom:4}}>{title}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {localBids.map(b=>{
            const proj = b.projects || {};
            const sc = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            return (
              <div key={b.id} style={{background:"white",borderRadius:12,border:"1px solid rgba(42,53,32,0.09)",padding:"18px 20px",boxShadow:"0 1px 3px rgba(42,53,32,0.04)",display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:"Playfair Display,serif",fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:4}}>{proj.title || "Project"}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:8}}>{proj.church_name || "—"} ·  {proj.city || "—"}</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <div style={{fontSize:12,color:"var(--text-mid)"}}>Your bid: <strong style={{color:"var(--navy)"}}>${Number(b.amount).toLocaleString()}</strong></div>
                    <div style={{fontSize:12,color:"var(--text-mid)"}}> {b.timeline}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{new Date(b.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <span style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>{sc.label}</span>
                  {b.status==="pending" && (
                    <button onClick={()=>handleWithdraw(b.id)} disabled={withdrawing===b.id} style={{padding:"5px 11px",borderRadius:7,border:"1px solid var(--border)",background:"white",color:"var(--text-muted)",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif",opacity:withdrawing===b.id?0.5:1}}>
                      {withdrawing===b.id?"…":"Withdraw"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   UPGRADE MODAL (bid limit hit)
══════════════════════════════════ */
function UpgradeModal({onClose, onUpgrade}){
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Log upgrade intent to Supabase for follow-up
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (user) {
      await supabase.from("upgrade_requests").insert({ user_id: user.id, plan: "pro", created_at: new Date().toISOString() }).catch(() => {});
    }
    setLoading(false);
    setRequested(true);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:440,overflow:"hidden",animation:"fadeUp 0.2s ease",boxShadow:"0 24px 64px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"var(--navy)",padding:"28px 28px 24px",textAlign:"center",position:"relative"}}>
          <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"linear-gradient(rgba(232,224,208,1) 1px,transparent 1px),linear-gradient(90deg,rgba(232,224,208,1) 1px,transparent 1px)",backgroundSize:"24px 24px"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"white",marginBottom:6}}>You've used your 10 free bids</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>Upgrade to Pro for unlimited bids and get more ministry clients.</div>
          </div>
        </div>
        <div style={{padding:"24px 28px"}}>
          <div style={{background:"var(--gold-pale)",border:"1px solid rgba(232,224,208,0.3)",borderRadius:12,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--gold)",marginBottom:6}}>Pro Plan</div>
            <div style={{fontFamily:"Playfair Display,serif",fontSize:40,fontWeight:700,color:"var(--navy)",lineHeight:1}}>$19<span style={{fontSize:16,fontWeight:400,color:"var(--text-muted)"}}>/mo</span></div>
          </div>
          {[
            "Unlimited bids every month",
            "Faith-Verified badge on your profile",
            "Featured placement in vendor directory",
            "10% platform fee capped at $200 (same as free)",
          ].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid var(--border)":"none"}}>
              <div style={{width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>✓</div>
              <span style={{fontSize:13,color:"var(--text-mid)"}}>{f}</span>
            </div>
          ))}
          {requested ? (
            <div style={{textAlign:"center",padding:"16px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:10,marginTop:20}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--success)",marginBottom:4}}>✓ Request received!</div>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>We'll reach out within 24 hours to set up Pro access.</div>
            </div>
          ) : (
            <button className="btn-primary" style={{width:"100%",justifyContent:"center",marginTop:20,padding:"13px"}} onClick={handleUpgrade} disabled={loading}>
              {loading ? "Processing..." : "Upgrade to Pro — $19/mo"}
            </button>
          )}
          <button className="btn-secondary" style={{width:"100%",justifyContent:"center",marginTop:10}} onClick={onClose}>Maybe Later</button>
          <div style={{textAlign:"center",fontSize:11,color:"var(--text-muted)",marginTop:10}}>Cancel anytime · No contracts</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   VENDORS SCREEN
══════════════════════════════════ */
function VendorsScreen({role, nav, currentUser}){
  const [view, setView] = useState("directory");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id || null));
  }, []);

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setVendors(data.map(v => ({
        id: v.id,
        name: v.name,
        category: v.category || "",
        city: v.city || "",
        bio: v.bio || "",
        emoji: v.emoji || "",
        cover: v.cover || "#1E3050",
        rating: v.rating || 5.0,
        reviews: v.reviews_count || 0,
        projects: v.projects_count || 0,
        verified: v.verified || false,
        tier: v.tier || "Basic",
        tags: v.tags || [],
        faith_statement: v.faith_statement || "",
        user_id: v.user_id,
      })));
    }
    setLoading(false);
  };

  const filtered = vendors.filter(v=>{
    const q = search.toLowerCase();
    const ms = !q ||
      (v.name||"").toLowerCase().includes(q) ||
      (v.category||"").toLowerCase().includes(q) ||
      (v.city||"").toLowerCase().includes(q) ||
      (v.bio||"").toLowerCase().includes(q) ||
      (v.tags||[]).some(t=>(t||"").toLowerCase().includes(q));
    const mc = catFilter==="All"||v.category===catFilter;
    const mv = !verifiedOnly || v.verified;
    return ms&&mc&&mv;
  }).sort((a,b)=>{
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return (b.rating||0) - (a.rating||0);
  });

  const featuredVendors = vendors.filter(v => v.verified && (v.reviews||0) >= 3).slice(0,8);

  if(view==="edit"&&selectedVendor) return (
    <EditVendorProfile
      vendor={selectedVendor}
      onBack={()=>setView("profile")}
      onSave={async (updates) => {
        const { error } = await supabase.from("vendors").update(updates).eq("id", selectedVendor.id);
        if (!error) {
          if (selectedVendor.user_id) {
            await supabase.from("profiles").update({ org_name: updates.name, city: updates.city }).eq("id", selectedVendor.user_id);
          }
          const updated = {...selectedVendor, ...updates};
          setSelectedVendor(updated);
          setVendors(vs => vs.map(v => v.id === selectedVendor.id ? updated : v));
          setView("profile");
        }
      }}
    />
  );
  if(view==="profile"&&selectedVendor) return <VendorProfile vendor={selectedVendor} onBack={()=>{setView("directory");setSelectedVendor(null);}} nav={nav} onEdit={selectedVendor.user_id===currentUserId?()=>setView("edit"):null}/>;

  return (
    <div className="page">
      {/* Dark screen header */}
      <div className="screen-header hd-vendors">
        <div className="screen-header-bg"/>
        <div className="screen-header-content">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div>
              {!currentUser && <button onClick={()=>nav("landing")} style={{background:"none",border:"none",color:"var(--text-muted)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",marginBottom:8,padding:0}}>← Back to Home</button>}
              <div className="screen-header-eyebrow">Vendor Directory</div>
              <div className="screen-header-title">Christian Service Providers</div>
              <div className="screen-header-sub">Browse faith-verified professionals ready to serve your ministry.</div>
            </div>
            <div style={{display:"flex",gap:8,paddingTop:4,flexShrink:0}}>
              <button
                className={`btn-header${verifiedOnly?" active":""}`}
                onClick={()=>setVerifiedOnly(v=>!v)}
                style={verifiedOnly?{background:"rgba(232,224,208,0.2)",borderColor:"rgba(232,224,208,0.4)"}:{}}
              >✦ {verifiedOnly?"Verified":"All Vendors"}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured verified vendors strip */}
      {featuredVendors.length > 0 && !search && catFilter==="All" && (
        <div className="vendor-featured-strip">
          <div className="vendor-featured-label">✦ Faith Verified — Top Rated</div>
          <div className="vendor-featured-scroll">
            {featuredVendors.map(v=>(
              <div key={v.id} className="vendor-featured-chip" onClick={()=>{setSelectedVendor(v);setView("profile");}}>
                <div className="vendor-featured-chip-avatar" style={{background:v.cover||"var(--navy)",color:"var(--gold-light)"}}>
                  {v.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div className="vendor-featured-chip-name">{v.name}</div>
                  <div className="vendor-featured-chip-cat">{v.category}</div>
                </div>
                <div className="vendor-featured-chip-badge">★ {Number(v.rating||5).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{position:"relative",marginBottom:16}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:0.3,pointerEvents:"none"}}>⌕</span>
        <input
          placeholder="Search by name, category, or location..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{width:"100%",padding:"11px 14px 11px 38px",borderRadius:12,border:"1.5px solid rgba(42,53,32,0.12)",fontFamily:"DM Sans,sans-serif",fontSize:13,background:"white",outline:"none",transition:"all 0.2s",color:"var(--text)",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor="var(--navy)"}
          onBlur={e=>e.target.style.borderColor="rgba(42,53,32,0.12)"}
        />
        {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--text-muted)",lineHeight:1}}>×</button>}
      </div>

      {/* Category pills */}
      <div className="vendor-cat-bar">
        <button className={`vendor-cat-pill${catFilter==="All"?" active":""}`} onClick={()=>setCatFilter("All")}>All</button>
        {CATEGORIES.map(c=>(
          <button key={c.label} className={`vendor-cat-pill${catFilter===c.label?" active":""}`} onClick={()=>setCatFilter(catFilter===c.label?"All":c.label)}>
            <span className="vendor-cat-pill-icon">{c.icon}</span>
            {c.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Count + clear */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div style={{fontSize:11,color:"var(--text-muted)",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>
          {loading ? "Loading…" : `${filtered.length} ${filtered.length!==1?"providers":"provider"}${catFilter!=="All"?` · ${catFilter}`:""}`}
        </div>
        {(catFilter!=="All"||verifiedOnly) && (
          <button onClick={()=>{setCatFilter("All");setVerifiedOnly(false);}} style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"1px solid var(--border)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Clear filters ×</button>
        )}
      </div>

      {loading ? (
        <div className="vendor-tile-grid">
          {[1,2,3,4,5,6].map(i=>(
            <div key={i} style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(42,53,32,0.09)",background:"white"}}>
              <div style={{height:96,background:"var(--cream-dark)",animation:"skeleton 1.5s ease infinite"}}/>
              <div style={{padding:"32px 18px 18px"}}>
                <div style={{height:16,width:"60%",background:"var(--cream-dark)",borderRadius:6,marginBottom:8,animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{height:11,width:"40%",background:"var(--cream-dark)",borderRadius:6,marginBottom:10,animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{height:11,width:"80%",background:"var(--cream-dark)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(42,53,32,0.09)",padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
          <div style={{width:40,height:2,background:"rgba(0,0,0,0.1)",borderRadius:2,margin:"0 auto 16px"}}/>
          <div style={{fontSize:16,fontWeight:700,color:"var(--navy)",marginBottom:8}}>No vendors found</div>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:20}}>Try a different category or clear your filters.</div>
          <button className="btn-secondary" onClick={()=>{setSearch("");setCatFilter("All");setVerifiedOnly(false);}}>Clear All Filters</button>
        </div>
      ) : (
        <div className="vendor-tile-grid">
          {filtered.map(v=>{
            const initials = v.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
            return (
              <div key={v.id} className={`vendor-tile${v.verified?" verified":""}`} onClick={()=>{setSelectedVendor(v);setView("profile");}}>
                {/* Left accent bar */}
                <div className="vendor-tile-accent"/>

                {/* Avatar */}
                <div style={{display:"flex",alignItems:"center",padding:"16px 14px 16px 18px",flexShrink:0}}>
                  <div className="vendor-tile-avatar">{initials}</div>
                </div>

                {/* Body */}
                <div className="vendor-tile-body">
                  <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                    <div className="vendor-tile-name">{v.name}</div>
                    {v.verified && <span className="vendor-tile-verified-badge">✦ Verified</span>}
                    {v.tier==="Pro" && <span style={{padding:"2px 7px",borderRadius:100,background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",fontSize:9,fontWeight:700,color:"#9333ea",letterSpacing:0.5}}>PRO</span>}
                  </div>
                  <div className="vendor-tile-cat">{v.category}{v.city?` · ${v.city}`:""}</div>
                  {v.bio && <div className="vendor-tile-bio">{v.bio}</div>}
                  {(v.tags||[]).length > 0 && (
                    <div className="vendor-tile-tags">
                      {v.tags.slice(0,3).map((t,i)=><span key={i} className="vendor-tile-tag">{t}</span>)}
                    </div>
                  )}
                </div>

                {/* Right meta */}
                <div className="vendor-tile-meta">
                  <div style={{textAlign:"right"}}>
                    <div className="vendor-tile-rating">
                      <span className="vendor-tile-rating-stars">★</span>
                      {Number(v.rating||5).toFixed(1)}
                    </div>
                    <div className="vendor-tile-reviews">{v.reviews||0} review{(v.reviews||0)!==1?"s":""}</div>
                  </div>
                  {(v.projects||0) > 0 && (
                    <div style={{fontSize:10,color:"var(--text-muted)",textAlign:"right"}}>{v.projects} project{(v.projects||0)!==1?"s":""}</div>
                  )}
                  <button
                    className="vendor-tile-cta"
                    onClick={e=>{e.stopPropagation();setSelectedVendor(v);setView("profile");}}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Helper: start or find conversation with real church name from profile
async function startConversation(vendor, nav) {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) { nav("auth"); return; }
  if (!user) { nav("auth"); return; }
  const { data: profile } = await supabase.from("profiles").select("org_name").eq("id", user.id).maybeSingle();
  const churchName = profile?.org_name || "Church";
  const { data: existing } = await supabase.from("conversations").select("id").eq("church_id", user.id).eq("vendor_name", vendor.name).maybeSingle();
  if (!existing) {
    await supabase.from("conversations").insert({
      church_id: user.id,
      church_name: churchName,
      vendor_name: vendor.name,
      vendor_emoji: vendor.emoji || "",
      status: "open",
      last_message: "Conversation started",
      last_message_at: new Date().toISOString(),
    });
  }
  nav("messages");
}

function VendorProfile({vendor:v, onBack, nav, onEdit}){
  const [tab, setTab] = useState("about");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setCurrentUser(data?.user || null));
  }, []);

  const isOwner = currentUser && v.user_id === currentUser.id;

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Directory</button>
      <div className="profile-hero">
        <div className="profile-cover"><div className="profile-cover-pattern"/></div>
        <div className="profile-info">
          <div className="profile-avatar" style={{fontSize:22,fontWeight:700,letterSpacing:0.5}}>{v.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
          <div className="profile-name">{v.name}</div>
          <div className="profile-cat">{v.category} · {v.city}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10,marginBottom:4}}>
            {v.verified && <BadgeChip badge={{label:"Faith Verified",color:"var(--gold-text)",bg:"rgba(232,224,208,0.2)"}}/>}
            {v.tier==="Pro" && <BadgeChip badge={{label:"Pro Member",color:"#D8B4FE",bg:"rgba(168,85,247,0.15)"}}/>}
            {v.reviews_count>=10 && v.rating>=4.8 && <BadgeChip badge={{label:"Top Rated",color:"var(--gold-light)",bg:"rgba(232,224,208,0.15)"}}/>}
            {v.reviews_count>=25 && <BadgeChip badge={{label:"25 Reviews",color:"var(--gold-light)",bg:"rgba(232,224,208,0.15)"}}/>}
          </div>
          <div className="profile-stats-row">
            {[{num:Number(v.rating||5).toFixed(1)+"★",label:"Rating"},{num:v.reviews||0,label:"Reviews"},{num:v.projects||0,label:"Projects"}].map((s,i)=>(
              <div key={i} className="profile-stat"><div className="profile-stat-num">{s.num}</div><div className="profile-stat-label">{s.label}</div></div>
            ))}
          </div>
          {onEdit && <button className="btn-secondary" style={{marginTop:12,fontSize:12,padding:"6px 14px"}} onClick={onEdit}>Edit Profile</button>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {["about","availability","reviews"].map(t=>(
          <button key={t} className={`filter-pill${tab===t?" active":""}`} style={{textTransform:"capitalize"}} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>
      {tab==="about" && (
        <div className="card"><div className="card-body">
          <div className="detail-section-title">About</div>
          <div className="detail-body" style={{marginBottom:16}}>{v.bio}</div>
          {(v.tags && v.tags.length > 0) && <>
            <div className="detail-section-title">Tags</div>
            <div className="skill-tags" style={{marginBottom:16}}>
              {v.tags.map(t=><span key={t} className="skill-tag">{t}</span>)}
            </div>
          </>}
          {v.faith_statement && <>
            <div className="detail-section-title" style={{marginTop:16}}>Faith Statement</div>
            <div className="detail-body" style={{marginBottom:16,fontStyle:"italic"}}>"{v.faith_statement}"</div>
          </>}
          <button className="btn-primary" onClick={async () => {
            try {
              const { data: authData } = await supabase.auth.getUser();
              const user = authData?.user;
              if (!user) { if(nav) nav("auth"); return; }
              try { await startConversation(v, nav); }
              catch(err) { console.error("Failed to start conversation:", err); }
            } catch(err) {
              console.error("Failed to start conversation:", err);
            }
          }}> Contact Vendor</button>
        </div></div>
      )}
      {tab==="availability" && (
        <div style={{maxWidth:520}}>
          <div style={{marginBottom:14,padding:"12px 16px",background:"var(--cream)",borderRadius:10,border:"1px solid var(--border)",fontSize:13,color:"var(--text-mid)"}}>
            {isOwner
              ? "This is your public availability calendar. Click any future date to toggle your availability — churches can see this when deciding who to contact."
              : `${v.name}'s availability calendar. Green dates mean they are open to new work.`
            }
          </div>
          <AvailabilityCalendar vendorId={v.id} editable={!!isOwner} />
          {!isOwner && (
            <div style={{marginTop:14}}>
              <button className="btn-primary" onClick={async () => {
                try { await startConversation(v, nav); }
                catch(err) { console.error(err); }
              }}>Check Availability & Contact</button>
            </div>
          )}
        </div>
      )}
      {tab==="reviews" && <VendorReviews vendorId={v.id}/>}
    </div>
  );
}


/* ══════════════════════════════════
   VENDOR REVIEWS (per-vendor)
══════════════════════════════════ */
function VendorReviews({vendorId}){
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setReviews(data.map(r => ({
          id: r.id,
          author: r.author || "Anonymous Church",
          avatar: "CH",
          city: r.city || "",
          project: r.project || "",
          rating: r.rating || 5,
          date: new Date(r.created_at).toLocaleDateString("en-US", {month:"short",year:"numeric"}),
          featured: r.featured || false,
          verified: r.verified !== false,
          helpful: r.helpful || 0,
          body: r.body || "",
          cats: r.cats || [],
          tags: r.tags || [],
          recommend: r.recommend !== false,
          reply: r.reply || null,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [vendorId]);

  if (loading) return <div style={{padding:"30px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Loading reviews...</div>;
  if (reviews.length === 0) return (
    <div style={{textAlign:"center",padding:"40px",color:"var(--text-muted)"}}>
      <div style={{fontSize:32,marginBottom:10,opacity:0.3}}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
      <div style={{fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:5}}>No reviews yet</div>
      <div style={{fontSize:13}}>Reviews will appear here once churches complete projects with this vendor.</div>
    </div>
  );
  return (
    <>
      {reviews.map(r=>(
        <div key={r.id} className={`review-card${r.featured?" featured":""}`}>
          <div className="review-top">
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div className="review-avatar">{r.avatar}</div>
              <div><div className="review-author-name">{r.author}{r.verified&&<span className="verified-badge">✓ Verified</span>}</div><div className="review-author-meta">{r.city}</div></div>
            </div>
            <div style={{textAlign:"right"}}><div className="review-stars">{starFill(r.rating)}</div><div className="review-date">{r.date}</div></div>
          </div>
          <div className="review-project-tag"> {r.project}</div>
          <div className="review-body">{r.body}</div>
          {(r.cats||[]).length>0 && <div className="review-cats">{r.cats.map((c,i)=><div key={i} className="review-cat-chip"><span style={{color:"var(--gold)",fontSize:10}}>{starFill(c.stars)}</span>{c.label}</div>)}</div>}
          {(r.tags||[]).length>0 && <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:9}}>{r.tags.map((t,i)=><span key={i} style={{padding:"2px 9px",background:"var(--gold-pale)",border:"1px solid rgba(232,224,208,0.25)",borderRadius:"100px",fontSize:10,fontWeight:600,color:"var(--gold)"}}>{t}</span>)}</div>}
          {r.reply&&<div className="review-reply-box"><div className="review-reply-label"> Response</div><div className="review-reply-text">{r.reply}</div></div>}
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:10,paddingTop:10,borderTop:"1px solid var(--border)"}}>
            {r.helpful} found helpful
            {r.recommend && <span style={{marginLeft:12,color:"var(--success)",fontWeight:600}}>✓ Would Rehire</span>}
          </div>
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════
   MESSAGES SCREEN
══════════════════════════════════ */
function MessagesScreen({role}){
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const subRef = useRef(null);
  const currentUserRef = useRef(null); // stable ref for realtime callbacks

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user || null;
      setCurrentUser(user);
      currentUserRef.current = user;
      if (user) fetchConvos(user.id);
    });
    return () => { if (subRef.current) subRef.current.unsubscribe(); };
  }, []);

  // When active conversation changes, load messages and subscribe
  useEffect(() => {
    if (!activeId) return;
    fetchMessages(activeId);
    // Unsubscribe previous
    if (subRef.current) subRef.current.unsubscribe();
    // Real-time subscription for new messages
    subRef.current = supabase
      .channel(`messages:${activeId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeId}`,
      }, payload => {
        const m = payload.new;
        setMessages(prev => [...prev, {
          id: m.id,
          from: m.sender_id === currentUserRef.current?.id ? "me" : "them",
          type: "text",
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
        }]);
        // Update preview in convo list
        setConvos(cs => cs.map(c => c.id === activeId
          ? {...c, preview: m.text, time: "Just now"}
          : c
        ));
      })
      .subscribe();
  }, [activeId]);

  const fetchConvos = async (userId) => {
    setLoadingConvos(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`church_id.eq.${userId},vendor_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });
    if (!error && data) {
      setConvos(data.map(c => ({
        id: c.id,
        name: userId === c.church_id ? (c.vendor_name || "Vendor") : (c.church_name || "Church"),
        emoji: c.vendor_emoji || "",
        type: userId === c.church_id ? "vendor" : "church",
        project: c.project_id || "Project",
        status: c.status || "open",
        unread: 0,
        time: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : "",
        preview: c.last_message || "No messages yet",
      })));
      if (data.length > 0) setActiveId(data[0].id);
    }
    setLoadingConvos(false);
  };

  const fetchMessages = async (convoId) => {
    setLoadingMsgs(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        from: m.sender_id === currentUser?.id ? "me" : "them",
        type: "text",
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
      })));
    }
    setLoadingMsgs(false);
  };

  const handleSelect = (id) => {
    setActiveId(id);
    setConvos(cs => cs.map(c => c.id === id ? {...c, unread: 0} : c));
  };

  const handleSend = async (text) => {
    if (!text.trim() || !activeId || !currentUser) return;
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId,
      sender_id: currentUser.id,
      text,
    });
    if (!error) {
      // Update last_message on conversation
      await supabase.from("conversations")
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq("id", activeId);
      // Notify the other party
      const convo = convos.find(c => c.id === activeId);
      if (convo) {
        // Find the other user's id — if we're the church, notify the vendor_user_id; vice versa
        const recipientId = convo.other_user_id || convo.vendor_user_id || convo.church_id;
        if (recipientId && recipientId !== currentUser.id) {
          await supabase.from("notifications").insert({
            user_id: recipientId,
            type: "new_message",
            title: "New message",
            body: text.length > 60 ? text.slice(0, 60) + "…" : text,
            link: "messages",
            read: false,
            created_at: new Date().toISOString(),
          }).catch(()=>{});
        }
      }
    }
  };

  const active = convos.find(c => c.id === activeId);
  const totalUnread = convos.reduce((a, c) => a + c.unread, 0);
  const filtered = convos.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || (c.project||"").toLowerCase().includes(search.toLowerCase());
    const mf = filter === "All" || (filter === "Unread" && c.unread > 0) || (filter === "Hired" && c.status === "hired");
    return ms && mf;
  });

  return (
    <div className="msg-root">
      <aside className="inbox">
        <div className="inbox-head">
          <div className="inbox-title-row">
            <span className="inbox-title">Messages</span>
            {totalUnread > 0 && <span className="inbox-badge">{totalUnread} new</span>}
          </div>
          <div className="inbox-search"><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        </div>
        <div className="inbox-filters">
          {["All","Unread","Hired"].map(f=><button key={f} className={`inbox-filter${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>)}
        </div>
        <div className="convo-list">
          {loadingConvos ? (
            <div style={{padding:"30px",textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.2)"}}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{padding:"32px 20px",textAlign:"center"}}>
              <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.45)",marginBottom:6}}>No conversations yet</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",lineHeight:1.6}}>Conversations start when you contact a vendor from their profile, or when a church reaches out to you.</div>
            </div>
          ) : filtered.map(c=>(
            <div key={c.id} className={`convo-item${activeId===c.id?" active":""}`} onClick={()=>handleSelect(c.id)}>
              <div className={`convo-avatar ${c.type}`}>
                {c.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                {c.unread>0&&<div className="convo-unread-dot"/>}
              </div>
              <div className="convo-body">
                <div className="convo-top"><span className="convo-name">{c.name}</span><span className="convo-time">{c.time}</span></div>
                <div className="convo-project">{c.project}</div>
                <div className={`convo-preview${c.unread>0?" bold":""}`}>{c.preview}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
      {active
        ? <MsgChatPanel convo={active} messages={messages} loadingMsgs={loadingMsgs} currentUser={currentUser} onSend={handleSend} showSidebar={showSidebar} onToggleSidebar={()=>setShowSidebar(s=>!s)}/>
        : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)",flexDirection:"column",gap:12,padding:"40px"}}>
            <div style={{width:52,height:52,borderRadius:16,background:"white",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8,boxShadow:"0 2px 8px rgba(42,53,32,0.06)"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--navy)",marginBottom:4}}>{convos.length===0?"No conversations yet":"Select a conversation"}</div>
            <div style={{fontSize:13,color:"var(--text-muted)",textAlign:"center",lineHeight:1.7,maxWidth:320,fontWeight:300}}>
              {convos.length===0
                ? "Conversations are created automatically when you hire a vendor or contact one from their profile page."
                : "Choose a conversation from the left to view messages."}
            </div>
          </div>
      }
      {active && showSidebar && <MsgProjectSidebar convo={active}/>}
    </div>
  );
}

function MsgChatPanel({convo, messages, loadingMsgs, currentUser, onSend, showSidebar, onToggleSidebar}){
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await onSend(input);
    setInput("");
    setSending(false);
  };
  const onKey = (e) => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };

  // Group consecutive messages from same sender
  const grouped = [];
  let i = 0;
  while(i < messages.length){
    const cur = messages[i];
    const group = {from: cur.from, msgs: [cur]};
    while(i+1 < messages.length && messages[i+1].from === cur.from){ i++; group.msgs.push(messages[i]); }
    grouped.push(group); i++;
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-head">
        <div className="chat-head-left">
          <div className={`chat-head-avatar ${convo.type}`}>
            {convo.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div>
            <div className="chat-head-name">{convo.name}</div>
            <div className="chat-head-sub">{convo.project}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {convo.status==="hired" && (
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:100,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",fontSize:10,fontWeight:700,color:"rgba(34,197,94,0.7)",letterSpacing:0.8,textTransform:"uppercase"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(34,197,94,0.7)"}}/>
              Hired
            </div>
          )}
          <button
            onClick={onToggleSidebar}
            style={{width:34,height:34,borderRadius:9,border:"1px solid",borderColor:showSidebar?"var(--navy)":"rgba(42,53,32,0.12)",background:showSidebar?"var(--navy)":"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showSidebar?"var(--gold-light)":"var(--text-muted)"} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <div className="sys-msg">
          <div className="sys-msg-inner gold">{convo.project}</div>
        </div>
        {convo.status==="hired" && (
          <div className="sys-msg">
            <div className="sys-msg-inner success">Vendor hired — {convo.name} is on this project</div>
          </div>
        )}
        <div className="msg-day-divider">
          <div className="msg-day-line"/>
          <span className="msg-day-label">Today</span>
          <div className="msg-day-line"/>
        </div>
        {loadingMsgs ? (
          <div style={{textAlign:"center",padding:"40px 20px",fontSize:12,color:"rgba(255,255,255,0.18)",letterSpacing:0.5}}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <div style={{width:36,height:1,background:"rgba(255,255,255,0.08)"}}/>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.2)",fontWeight:500,letterSpacing:0.3}}>No messages yet</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.12)"}}>Start the conversation below</div>
          </div>
        ) : grouped.map((group,gi)=>(
          <div key={gi} className={`msg-group ${group.from}`}>
            {group.msgs.map((msg,mi)=>(
              <div key={msg.id} className={`msg-row ${msg.from}`}>
                <div className={`msg-avatar-sm ${mi===group.msgs.length-1?convo.type:"placeholder"}`}>
                  {mi===group.msgs.length-1 ? convo.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : ""}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:msg.from==="me"?"flex-end":"flex-start",gap:2}}>
                  <div className={`bubble ${msg.from}`}>
                    {msg.text}
                    <div className="bubble-time">{msg.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="quick-reply-row">
          {QUICK_REPLIES.map((r,i)=>(
            <button key={i} className="quick-reply" onClick={()=>setInput(r)}>{r}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Message ${convo.name.split(" ")[0]}…`}
            rows={1}
          />
          <button className="send-btn" onClick={send} disabled={!input.trim()||sending}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MsgProjectSidebar({convo}){
  const initials = convo.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const ACTIONS = [
    {
      label:"View Project",
      icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    },
    {
      label:"Share a File",
      icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    },
    {
      label:"Report Issue",
      icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    },
    {
      label:"Milestones",
      icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    },
  ];

  return (
    <aside style={{
      width:220,minWidth:220,background:"white",
      borderLeft:"1px solid rgba(42,53,32,0.06)",
      display:"flex",flexDirection:"column",overflow:"hidden",
    }}>
      {/* Project card — compact */}
      <div style={{padding:"16px",borderBottom:"1px solid rgba(42,53,32,0.06)"}}>
        <div style={{
          background:convo.status==="hired"
            ?"linear-gradient(135deg,#0f2010,#1a3215)"
            :"linear-gradient(135deg,var(--navy),var(--navy-light))",
          borderRadius:12,padding:"14px 14px",position:"relative",overflow:"hidden",
        }}>
          <div style={{position:"absolute",inset:0,opacity:0.03,backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:6}}>Project</div>
            <div style={{fontSize:12,fontWeight:700,color:"white",lineHeight:1.35,marginBottom:8}}>{convo.project}</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:100,
              background:convo.status==="hired"?"rgba(34,197,94,0.15)":"rgba(232,224,208,0.08)",
              border:`1px solid ${convo.status==="hired"?"rgba(34,197,94,0.25)":"rgba(232,224,208,0.12)"}`,
              fontSize:9,fontWeight:700,
              color:convo.status==="hired"?"rgba(34,197,94,0.8)":"rgba(232,224,208,0.5)",
              letterSpacing:0.8,textTransform:"uppercase",
            }}>
              <span style={{width:4,height:4,borderRadius:"50%",background:"currentColor",display:"inline-block"}}/>
              {convo.status==="hired"?"Hired":"Open"}
            </div>
          </div>
        </div>
      </div>

      {/* Participant */}
      <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(42,53,32,0.05)"}}>
        <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10,opacity:0.6}}>Participant</div>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{
            width:34,height:34,borderRadius:9,
            background:convo.type==="vendor"?"linear-gradient(135deg,#1E3820,#2A4520)":"var(--navy)",
            color:"var(--gold-light)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,letterSpacing:0.4,
          }}>{initials}</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--navy)",lineHeight:1.2}}>{convo.name}</div>
            <div style={{fontSize:10,color:"var(--text-muted)",marginTop:2}}>
              {convo.type==="vendor"?"Service Provider":"Church / Ministry"}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone mini-track */}
      {convo.status==="hired" && (
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(42,53,32,0.05)"}}>
          <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10,opacity:0.6}}>Progress</div>
          {PS_MILESTONES.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{
                width:6,height:6,borderRadius:"50%",flexShrink:0,
                background:m.status==="done"?"rgba(22,163,74,0.7)":m.status==="active"?"var(--gold-light)":"rgba(0,0,0,0.12)",
                boxShadow:m.status==="active"?"0 0 0 3px rgba(232,224,208,0.18)":"none",
              }}/>
              <div style={{
                fontSize:11,color:m.status==="done"?"var(--text-muted)":"var(--text-mid)",
                textDecoration:m.status==="done"?"line-through":"none",
                flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              }}>{m.label}</div>
              <div style={{fontSize:9,color:"var(--text-muted)",flexShrink:0}}>{m.pct}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Action icon row — compact */}
      <div style={{padding:"14px 16px",marginTop:"auto",borderTop:"1px solid rgba(42,53,32,0.05)"}}>
        <div style={{fontSize:8,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:10,opacity:0.6}}>Quick Actions</div>
        <div style={{display:"flex",gap:6}}>
          {ACTIONS.map((a,idx)=>(
            <button
              key={idx}
              title={a.label}
              style={{
                flex:1,height:34,borderRadius:8,
                border:"1px solid rgba(42,53,32,0.09)",
                background:"var(--cream)",cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"var(--text-muted)",transition:"all 0.18s",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--navy)";e.currentTarget.style.color="var(--gold-light)";e.currentTarget.style.borderColor="var(--navy)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--cream)";e.currentTarget.style.color="var(--text-muted)";e.currentTarget.style.borderColor="rgba(42,53,32,0.09)";}}
            >
              {a.icon}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}



/* ══════════════════════════════════
   EDIT VENDOR PROFILE
══════════════════════════════════ */
function EditVendorProfile({vendor:v, onBack, onSave}){
  const [form, setForm] = useState({
    name: v.name || "",
    category: v.category || "",
    city: v.city || "",
    bio: v.bio || "",
    faith_statement: v.faith_statement || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, val) => setForm(f => ({...f, [k]: val}));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back to Profile</button>
      <div className="page-hd">
        <div><div className="eyebrow">Edit Profile</div><h1 className="page-title">Update Your Vendor Profile</h1></div>
      </div>
      <div style={{maxWidth:640}}>
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">Business Info</div></div>
          <div className="card-body">
            <div className="field"><label>Business Name</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your business name"/></div>
            <div className="field"><label>Service Category</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)}>
                <option value="">Select a category...</option>
                {CATEGORIES.map(c=><option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div className="field"><label>City, State</label><input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="Dallas, TX"/></div>
            <div className="field"><label>Bio</label><textarea rows={4} value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Describe your business and how you serve ministries..."/><div className="char-count">{form.bio.length}/300</div></div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-hd-title">Faith Statement</div></div>
          <div className="card-body">
            <div className="field">
              <label>Share your faith background</label>
              <textarea rows={3} value={form.faith_statement} onChange={e=>set("faith_statement",e.target.value)} placeholder="How does your faith shape your work and service to ministries?"/>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
          <button className="btn-secondary" onClick={onBack}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   REVIEWS SCREEN
══════════════════════════════════ */
function ReviewsScreen({role, showToast}){
  const [view, setView] = useState("dashboard");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [writingFor, setWritingFor] = useState(null);
  const [pendingList, setPendingList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data?.user;
      if (!user) return;
      setCurrentUser(user);
      const { data: profile } = await supabase.from("profiles").select("org_name, role").eq("id", user.id).maybeSingle();
      setUserProfile(profile);
      fetchReviews(user.id);
      if (role === "church" || profile?.role === "church") {
        fetchPendingReviews(user.id);
      }
    });
  }, []);

  const fetchPendingReviews = async (userId) => {
    // Find hired bids for this church that haven't been reviewed yet
    const { data: hiredBids } = await supabase
      .from("bids")
      .select("id, vendor_name, vendor_id, amount, created_at, projects(title)")
      .eq("church_id", userId)
      .eq("status", "hired")
      .order("created_at", { ascending: false });

    if (!hiredBids?.length) return;

    // Find which ones already have reviews
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("vendor_id")
      .eq("church_id", userId);

    const reviewedVendorIds = new Set((existingReviews || []).map(r => r.vendor_id));

    const pending = hiredBids
      .filter(b => !reviewedVendorIds.has(b.vendor_id))
      .map(b => ({
        id: b.id,
        name: b.vendor_name || "Vendor",
        vendorId: b.vendor_id,
        project: b.projects?.title || "Completed Project",
        completed: new Date(b.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" }),
      }));

    setPendingList(pending);
  };

  const fetchReviews = async (userId) => {
    setLoadingReviews(true);
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (role === "vendor" && userId) {
      // Vendors only see reviews written about them
      const { data: vendorRow } = await supabase.from("vendors").select("id").eq("user_id", userId).maybeSingle();
      if (vendorRow) query = query.eq("vendor_id", vendorRow.id);
    }
    const { data, error } = await query;
    if (!error && data) {
      // If DB has reviews use them, otherwise fall back to mock so dashboard isn't blank
      const mapped = data.map(r => ({
        id: r.id,
        author: r.author || "Anonymous Church",
        avatar: "CH",
        city: r.city || "",
        project: r.project || "",
        rating: r.rating || 5,
        date: new Date(r.created_at).toLocaleDateString("en-US", {month:"short",year:"numeric"}),
        featured: r.featured || false,
        verified: r.verified !== false,
        helpful: r.helpful || 0,
        body: r.body || "",
        cats: r.cats || [],
        tags: r.tags || [],
        recommend: r.recommend !== false,
        reply: r.reply || null,
      }));
      setReviews(mapped.length > 0 ? mapped : MOCK_REVIEWS);
    }
    setLoadingReviews(false);
  };

  const handleSubmitReview = async (data) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;
    const authorName = userProfile?.org_name || "Anonymous Church";
    const { error } = await supabase.from("reviews").insert({
      church_id: user?.id || null,
      vendor_id: writingFor?.vendorId || null,
      author: authorName,
      city: "",
      project: writingFor?.project || "Recent Project",
      rating: data.rating,
      body: data.body,
      title: data.title || "",
      tags: data.tags || [],
      recommend: data.recommend,
      cats: data.cats || [],
      featured: false,
      verified: true,
      helpful: 0,
      reply: null,
    });
    if (!error) {
      // Auto-recalculate vendor rating
      if (writingFor?.vendorId) {
        const { data: allRevs } = await supabase.from("reviews").select("rating").eq("vendor_id", writingFor.vendorId);
        if (allRevs?.length > 0) {
          const avg = allRevs.reduce((s,r)=>s+(r.rating||5),0) / allRevs.length;
          await supabase.from("vendors").update({ rating: Math.round(avg*10)/10, reviews_count: allRevs.length }).eq("id", writingFor.vendorId);
        }
      }
      await fetchReviews(currentUser?.id);
      if (currentUser) fetchPendingReviews(currentUser.id);
      setView("success");
      showToast("Review published");
    } else {
      showToast("Error publishing review: " + error.message);
    }
  };

  const handleReply = async (id, text) => {
    const { error } = await supabase.from("reviews").update({ reply: text }).eq("id", id);
    if (!error) {
      setReviews(r => r.map(rv => rv.id === id ? {...rv, reply: text} : rv));
      showToast("Response published");
    }
  };

  const handleHelpful = async (id) => {
    const review = reviews.find(r => r.id === id);
    if (!review) return;
    const newCount = (review.helpful || 0) + 1;
    await supabase.from("reviews").update({ helpful: newCount }).eq("id", id);
    setReviews(r => r.map(rv => rv.id === id ? {...rv, helpful: newCount} : rv));
  };
  const tabs = role==="church"
    ? [{id:"dashboard",label:"All Reviews"},{id:"pending",label:"Write a Review"}]
    : [{id:"dashboard",label:"My Reviews"}];
  return (
    <div>
      <div className="screen-header hd-reviews">
        <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 28px 0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div className="screen-header-eyebrow">{role==="vendor"?"Reputation":"Community"}</div>
              <div className="screen-header-title">{role==="vendor"?"Your Reviews":"Reviews & Ratings"}</div>
              <div className="screen-header-sub">{role==="vendor"?"What ministries say about your work.":"Honest feedback helps the whole community."}</div>
            </div>
            {role==="church" && <button className="btn-header" onClick={()=>setView("pending")}>Leave a Review</button>}
          </div>
          <div className="screen-header-tabs" style={{marginTop:14}}>
            {tabs.map(t=><button key={t.id} className={`screen-header-tab${view===t.id?" active":""}`} onClick={()=>setView(t.id)}>{t.label}</button>)}
          </div>
        </div>
      </div>
      {view==="dashboard" && <ReviewsDashboard reviews={reviews} loading={loadingReviews} role={role} onReply={handleReply} onHelpful={handleHelpful} onWrite={()=>setView("pending")}/>}
      {view==="pending"   && <PendingReviews pending={pendingList} role={role} onSelect={(p)=>{setWritingFor(p);setView("write");}}/>}
      {view==="write"     && <WriteReview vendor={writingFor} onSubmit={handleSubmitReview} onBack={()=>setView("pending")}/>}
      {view==="success"   && (
        <div className="page">
          <button className="btn-back" onClick={()=>setView("dashboard")}>← Back to Reviews</button>
          <div className="success-screen">
            <div className="success-icon" style={{background:"linear-gradient(135deg,var(--gold),var(--gold-light))"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <h1 className="success-title">Review published!</h1>
            <p className="success-sub">Thank you for your honest feedback. Your review helps ministries across the country make better hiring decisions.</p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
              <button className="btn-primary" onClick={()=>setView("dashboard")}>View All Reviews</button>
              <button className="btn-secondary" onClick={()=>setView("pending")}>Review Another Vendor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsDashboard({reviews, loading, role, onReply, onHelpful, onWrite}){
  if (!loading && reviews.length === 0) return (
    <div className="page">
      <div style={{background:"white",borderRadius:16,border:"1px solid rgba(42,53,32,0.09)",padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
        <div style={{width:48,height:48,borderRadius:14,background:"var(--gold-pale)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-text)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{role==="vendor"?"No reviews yet":"No reviews yet"}</div>
        <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>
          {role==="vendor"
            ? "Complete projects with churches and ask them to leave a review. Reviews build your credibility on the platform."
            : "Reviews appear here after churches complete projects. Use the Write a Review tab to rate a vendor you've worked with."}
        </div>
        {role==="church" && <button className="btn-primary" onClick={onWrite}>Write a Review →</button>}
      </div>
    </div>
  );
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Most Recent");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const avg = reviews.length > 0 ? (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1) : "0.0";
  const dist = [5,4,3,2,1].map(n=>({stars:n,count:reviews.filter(r=>r.rating===n).length,pct:reviews.length>0?Math.round(reviews.filter(r=>r.rating===n).length/reviews.length*100):0}));
  const filtered = reviews
    .filter(r=>filter==="All"||(filter==="5★"&&r.rating===5)||(filter==="4★"&&r.rating===4)||(filter==="3★ & below"&&r.rating<=3)||(filter==="Unanswered"&&!r.reply))
    .sort((a,b)=>sort==="Highest Rated"?b.rating-a.rating:sort==="Most Helpful"?b.helpful-a.helpful:0);
  return (
    <div className="page">
      {/* Stats strip */}
      <div style={{display:"flex",gap:0,background:"white",border:"1px solid rgba(42,53,32,0.09)",borderRadius:12,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
        {[
          {val:avg+"★", label:"Overall Rating", sub:"Based on all reviews", color:"#ca8a04"},
          {val:reviews.length, label:"Total Reviews", sub:`+${reviews.filter(r=>r.date?.includes("2025")).length} this year`, color:"var(--navy)"},
          {val:reviews.filter(r=>r.recommend).length, label:"Would Rehire", sub:`${Math.round(reviews.filter(r=>r.recommend).length/Math.max(reviews.length,1)*100)}% recommend`, color:"var(--success)"},
          {val:reviews.filter(r=>r.reply).length, label:"Replied To", sub:`${reviews.filter(r=>!r.reply).length} awaiting response`, color:"var(--info)"},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,padding:"18px 20px",borderRight:i<3?"1px solid var(--border)":"none"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:12,fontWeight:600,color:"var(--navy)",marginBottom:2}}>{s.label}</div>
            <div style={{fontSize:11,color:"var(--text-muted)"}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{background:"var(--navy)",borderRadius:14,padding:"22px 26px",marginBottom:18,display:"flex",gap:28,alignItems:"center"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:48,fontWeight:700,color:"white",lineHeight:1}}>{avg}</div>
              <div style={{fontSize:22,color:"var(--gold-light)",margin:"5px 0"}}>{"★".repeat(Math.round(avg))}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{reviews.length} reviews</div>
            </div>
            <div>{dist.map(d=>(
              <div key={d.stars} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",width:28,textAlign:"right"}}>{d.stars}★</span>
                <div style={{flex:1,height:7,background:"rgba(255,255,255,0.1)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${d.pct}%`,height:"100%",background:"linear-gradient(90deg,var(--gold),var(--gold-light))",borderRadius:3}}/></div>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",width:28}}>{d.pct}%</span>
              </div>
            ))}</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            {["All","5★","4★","3★ & below","Unanswered"].map(f=><button key={f} className={`filter-pill${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>)}
            <select style={{padding:"6px 11px",borderRadius:8,border:"1px solid rgba(42,53,32,0.12)",fontFamily:"DM Sans,sans-serif",fontSize:12,background:"white",outline:"none",color:"var(--text-muted)",marginLeft:"auto"}} value={sort} onChange={e=>setSort(e.target.value)}>
              <option>Most Recent</option><option>Highest Rated</option><option>Most Helpful</option>
            </select>
          </div>
          {filtered.map(r=>(
            <div key={r.id} className={`review-card${r.featured?" featured":""}`}>
              <div className="review-top">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="review-avatar">{r.avatar}</div>
                  <div><div className="review-author-name">{r.author}{r.verified&&<span className="verified-badge">✓ Verified</span>}</div><div className="review-author-meta">{r.city}</div></div>
                </div>
                <div style={{textAlign:"right"}}><div className="review-stars">{starFill(r.rating)}</div><div className="review-date">{r.date}</div></div>
              </div>
              <div className="review-project-tag"> {r.project}</div>
              <div className="review-body">{r.body}</div>
              <div className="review-cats">{r.cats.map((c,i)=><div key={i} className="review-cat-chip"><span style={{color:"var(--gold)",fontSize:10}}>{starFill(c.stars)}</span>{c.label}</div>)}</div>
              {r.tags?.length>0 && <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:9}}>{r.tags.map((t,i)=><span key={i} style={{padding:"2px 9px",background:"var(--gold-pale)",border:"1px solid rgba(232,224,208,0.25)",borderRadius:"100px",fontSize:10,fontWeight:600,color:"var(--gold)"}}>{t}</span>)}{r.recommend&&<span style={{padding:"2px 9px",background:"var(--success-bg)",border:"1px solid var(--success-border)",borderRadius:"100px",fontSize:10,fontWeight:600,color:"var(--success)"}}>Would Rehire</span>}</div>}
              {r.reply&&<div className="review-reply-box"><div className="review-reply-label"> Response</div><div className="review-reply-text">{r.reply}</div></div>}
              {replyingTo===r.id&&!r.reply&&(
                <div style={{background:"var(--cream)",borderRadius:9,padding:12,marginTop:10,border:"1px solid var(--border)"}}>
                  <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows={3} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid rgba(42,53,32,0.12)",fontFamily:"DM Sans,sans-serif",fontSize:13,color:"var(--text)",background:"white",outline:"none",resize:"none"}} placeholder="Write a thoughtful response..."/>
                  <div style={{display:"flex",gap:7,marginTop:7,justifyContent:"flex-end"}}>
                    <button className="btn-ghost" onClick={()=>setReplyingTo(null)}>Cancel</button>
                    <button className="btn-primary" onClick={()=>{onReply(r.id,replyText);setReplyingTo(null);setReplyText("");}}>Publish Response</button>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:12,paddingTop:10,borderTop:"1px solid var(--border)",alignItems:"center"}}>
                <span style={{fontSize:12,color:"var(--text-muted)"}}>{r.helpful} found helpful</span>
                <button className="btn-ghost" onClick={()=>onHelpful(r.id)}>Helpful</button>
                {role==="vendor"&&!r.reply&&replyingTo!==r.id&&<button className="btn-ghost" style={{color:"var(--gold)",borderColor:"rgba(232,224,208,0.3)"}} onClick={()=>{setReplyingTo(r.id);setReplyText("");}}> Respond</button>}
                {r.reply&&<span style={{fontSize:12,color:"var(--success)",marginLeft:"auto"}}>✓ Responded</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"white",border:"1px solid rgba(42,53,32,0.09)",borderRadius:12,boxShadow:"0 1px 3px rgba(42,53,32,0.04)",padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:20}}>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,color:"var(--navy)",lineHeight:1}}>98</div>
            <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>Reputation Score</div>
          </div>
          <div style={{flex:1,height:7,background:"var(--cream-dark)",borderRadius:3}}><div style={{width:"98%",height:"100%",background:"linear-gradient(90deg,var(--navy),var(--navy-light))",borderRadius:3}}/></div>
          <div style={{flexShrink:0,fontSize:11,color:"var(--success)",fontWeight:600}}>Top 3% of vendors</div>
        </div>
      </div>
    </div>
  );
}

function PendingReviews({pending, role, onSelect}){
  return (
    <div className="page">
      <div className="page-hd"><div><div className="eyebrow">Reviews Due</div><h1 className="page-title">Awaiting Your Review</h1><p className="page-sub">These vendors completed work for you. Your review helps the whole community.</p></div></div>
      {pending.length===0
        ?<div style={{textAlign:"center",padding:"60px 40px",color:"var(--text-muted)"}}><div style={{width:32,height:2,background:"var(--border)",borderRadius:2,margin:"0 auto 12px"}}/><div style={{fontSize:15,fontWeight:600,color:"var(--navy)"}}>All caught up!</div></div>
        :<>
          <div style={{padding:"11px 14px",background:"var(--warn-bg)",border:"1px solid var(--warn-border)",borderRadius:9,fontSize:13,color:"var(--warn)",marginBottom:18,fontWeight:500}}>⏰ Reviews help Christian vendors get more ministry clients. Takes just 2 minutes.</div>
          <div className="pending-card-wrap">
          {pending.map(p=>(
            <div key={p.id} className="pending-card" onClick={()=>onSelect(p)}>
              <div style={{width:44,height:44,borderRadius:11,background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{p.emoji}</div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"var(--navy)",marginBottom:2}}>{p.name}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{p.project}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:1}}>Completed {p.completed}</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                <span style={{padding:"2px 9px",background:"var(--warn-bg)",border:"1px solid var(--warn-border)",borderRadius:100,fontSize:10,fontWeight:600,color:"var(--warn)"}}>Review Due</span>
                <button className="btn-primary" style={{fontSize:11,padding:"5px 14px"}}>Write Review →</button>
              </div>
            </div>
          ))}
          </div>
        </>
      }
    </div>
  );
}

function WriteReview({vendor, onSubmit, onBack}){
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [subRatings, setSubRatings] = useState({Communication:0,"Quality of Work":0,Timeline:0,"Value for Money":0,"Faith Alignment":0});
  const [hoverSub, setHoverSub] = useState({});
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [recommend, setRecommend] = useState(null);
  const display = hover||rating;
  const canSubmit = rating>0&&body.length>30&&recommend!==null;
  return (
    <div className="page">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="page-hd"><div><div className="eyebrow">Write a Review</div><h1 className="page-title">Review: {vendor?.name||"Vendor"}</h1><p className="page-sub">{vendor?.project||"Completed Project"}</p></div></div>
      <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <div className="card"><div className="card-hd"><div className="card-hd-title">Overall Rating</div></div>
            <div className="card-body">
              <div className="star-picker">
                {[1,2,3,4,5].map(n=><button key={n} className={`star-btn${display>=n?" lit":""}`} onClick={()=>setRating(n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}>★</button>)}
              </div>
              <div style={{fontSize:13,color:"var(--text-muted)",height:18}}>{display>0?STAR_LABELS[display]:"Select a rating"}</div>
            </div>
          </div>
          <div className="card"><div className="card-hd"><div className="card-hd-title">Rate Each Category</div><span style={{fontSize:12,color:"var(--text-muted)"}}>Optional</span></div>
            <div className="card-body">
              {Object.keys(subRatings).map(cat=>(
                <div key={cat} className="sub-rating-row">
                  <div className="sub-rating-label">{cat}</div>
                  <div className="sub-stars">
                    {[1,2,3,4,5].map(n=><button key={n} className={`sub-star${(hoverSub[cat]||subRatings[cat])>=n?" lit":""}`} onClick={()=>setSubRatings(s=>({...s,[cat]:n}))} onMouseEnter={()=>setHoverSub(h=>({...h,[cat]:n}))} onMouseLeave={()=>setHoverSub(h=>({...h,[cat]:0}))}>★</button>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card"><div className="card-hd"><div className="card-hd-title">Your Review</div></div>
            <div className="card-body">
              <div className="field"><label>Review Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Summarize your experience in one line..."/></div>
              <div className="field"><label>Detailed Review *</label>
                <textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="Share your honest experience. What did they do well? How did their faith show up in their work?..."/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <div style={{fontSize:11,color:body.length<30?"var(--danger)":"var(--success)"}}>{body.length<30?`${30-body.length} more characters required`:"✓ Minimum length met"}</div>
                  <div className="char-count">{body.length}/1000</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card"><div className="card-hd"><div className="card-hd-title">Highlight Tags</div></div>
            <div className="card-body"><div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {HIGHLIGHT_TAGS.map(t=><div key={t} className={`tag-opt${tags.includes(t)?" sel":""}`} onClick={()=>setTags(ts=>ts.includes(t)?ts.filter(x=>x!==t):[...ts,t])}>{tags.includes(t)?"✓ ":""}{t}</div>)}
            </div></div>
          </div>
          <div className="card"><div className="card-hd"><div className="card-hd-title">Would You Rehire This Vendor? *</div></div>
            <div className="card-body"><div className="recommend-row">
              <div className={`recommend-opt${recommend===true?" sel-yes":""}`} onClick={()=>setRecommend(true)}><div style={{fontSize:12,fontWeight:600,color:recommend===true?"var(--success)":"var(--text-mid)"}}>Yes, I'd rehire them</div></div>
              <div className={`recommend-opt${recommend===false?" sel-no":""}`} onClick={()=>setRecommend(false)}><div style={{fontSize:12,fontWeight:600,color:recommend===false?"var(--danger)":"var(--text-mid)"}}>No, I wouldn't</div></div>
            </div></div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginTop:8}}>
            <button className="btn-primary" disabled={!canSubmit} onClick={()=>onSubmit({rating,body,title,tags,recommend,cats:Object.entries(subRatings).filter(([,v])=>v>0).map(([label,stars])=>({label,stars}))})}>Publish Review</button>
            <button className="btn-secondary" onClick={onBack}>Cancel</button>
            {!canSubmit&&<span style={{fontSize:12,color:"var(--text-muted)"}}>{rating===0?"Add a star rating":body.length<30?"Write at least 30 characters":"Select rehire preference"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   ADMIN ACTIVITY FEED (real data)
══════════════════════════════════ */
function AdminActivityFeed(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      // Fetch latest events from multiple tables in parallel
      const [vendorsRes, projectsRes, bidsRes, disputesRes] = await Promise.all([
        supabase.from("vendors").select("name, created_at, verified").order("created_at", {ascending:false}).limit(5),
        supabase.from("projects").select("title, church_name, created_at").order("posted_at", {ascending:false}).limit(5),
        supabase.from("bids").select("vendor_name, amount, created_at, status").order("created_at", {ascending:false}).limit(5),
        supabase.from("disputes").select("title, created_at, status").order("created_at", {ascending:false}).limit(3),
      ]);

      const events = [];

      (vendorsRes.data||[]).forEach(v => events.push({
        color: v.verified ? "var(--green)" : "var(--amber)",
        text: v.verified
          ? <><strong>{v.name}</strong> approved as verified vendor</>
          : <>New vendor <strong>{v.name}</strong> submitted for approval</>,
        time: new Date(v.created_at),
      }));

      (projectsRes.data||[]).forEach(p => events.push({
        color: "var(--blue2)",
        text: <><strong>{p.church_name}</strong> posted a new project: "{p.title}"</>,
        time: new Date(p.created_at),
      }));

      (bidsRes.data||[]).forEach(b => events.push({
        color: b.status === "hired" ? "var(--green)" : "var(--gold)",
        text: b.status === "hired"
          ? <><strong>{b.vendor_name}</strong> was hired — ${Number(b.amount).toLocaleString()}</>
          : <><strong>{b.vendor_name}</strong> submitted a bid — ${Number(b.amount).toLocaleString()}</>,
        time: new Date(b.created_at),
      }));

      (disputesRes.data||[]).forEach(d => events.push({
        color: "var(--red)",
        text: <>Dispute opened: "{d.title}"</>,
        time: new Date(d.created_at),
      }));

      // Sort by time descending
      events.sort((a,b) => b.time - a.time);

      setItems(events.slice(0, 8).map(e => ({
        ...e,
        timeStr: formatTimeAgo(e.time),
      })));
      setLoading(false);
    };
    fetchActivity();
  }, []);

  const formatTimeAgo = (date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff/60000);
    const hrs  = Math.floor(diff/3600000);
    const days = Math.floor(diff/86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  if (loading) return <div style={{padding:"16px 0",fontSize:12,color:"var(--atext-muted)"}}>Loading activity...</div>;
  if (items.length === 0) return <div style={{padding:"16px 0",fontSize:12,color:"var(--atext-muted)",textAlign:"center"}}>No activity yet</div>;

  return (
    <>
      {items.map((a,i)=>(
        <div key={i} className="feed-item">
          <div className="feed-dot" style={{background:a.color}}/>
          <div><div className="feed-text">{a.text}</div><div className="feed-time">{a.timeStr}</div></div>
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════
   ADMIN SCREEN
══════════════════════════════════ */
function AdminScreen({showToast}){
  const [adminView, setAdminView] = useState("overview");
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [modal, setModal] = useState(null);
  const [verificationApps, setVerificationApps] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [expandedApp, setExpandedApp] = useState(null);

  const [kpis, setKpis] = useState({ totalUsers:0, churches:0, vendors:0, activeProjects:0, verifiedVendors:0 });
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    fetchPendingVendors();
    fetchKpis();
    fetchAllUsers();
    fetchDisputes();
    fetchVerificationApps();
  }, []);

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setDisputes(data.map(d => ({
        id: d.id,
        title: d.title,
        body: d.body || "",
        church: d.church_name || "Unknown Church",
        vendor: d.vendor_name || "Unknown Vendor",
        amount: d.amount || "—",
        opened: new Date(d.created_at).toLocaleDateString(),
        urgent: d.urgent || false,
        status: d.status || "open",
      })));
    }
    setLoadingDisputes(false);
  };

  const fetchKpis = async () => {
    const [profilesRes, projectsRes, vendorsRes, verifiedRes] = await Promise.all([
      supabase.from("profiles").select("id, role", { count: "exact" }),
      supabase.from("projects").select("id", { count: "exact" }).eq("status", "open"),
      supabase.from("vendors").select("id", { count: "exact" }),
      supabase.from("vendors").select("id", { count: "exact" }).eq("verified", true),
    ]);
    // Use vendors table count directly (not affected by RLS like profiles)
    const vendorCount = vendorsRes.count || 0;
    // Profiles may be RLS-blocked — fall back to counting what we can
    const profileData = profilesRes.data || [];
    const total = Math.max(profilesRes.count || 0, profileData.length, vendorCount);
    const churches = profileData.filter(p => p.role === "church").length;
    setKpis({
      totalUsers: total,
      churches,
      vendors: vendorCount,
      activeProjects: projectsRes.count || 0,
      verifiedVendors: verifiedRes.count || 0,
    });
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    const [profilesRes, vendorsRes] = await Promise.all([
      supabase.from("profiles").select("id, role, org_name, city, denomination, category, created_at"),
      supabase.from("vendors").select("id, user_id, name, category, city, verified, tier, created_at"),
    ]);

    const profileList = profilesRes.data || [];
    const vendorList = vendorsRes.data || [];
    const vendorMap = {};
    vendorList.forEach(v => { vendorMap[v.user_id] = v; });

    const profileIds = new Set(profileList.map(u => u.id));
    const extraVendors = vendorList.filter(v => v.user_id && !profileIds.has(v.user_id));

    const merged = [
      ...profileList.map(u => {
        const vRow = vendorMap[u.id];
        return {
          id: u.id,
          name: u.org_name || vRow?.name || "Unnamed",
          type: u.role || "church",
          city: u.city || vRow?.city || "—",
          plan: vRow?.tier || (u.role === "vendor" ? "Basic" : "Free"),
          joined: new Date(u.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
          emoji: u.role === "vendor" ? "" : "CH",
          category: u.role === "vendor" ? (u.category || vRow?.category || "—") : (u.denomination || "—"),
          verified: vRow?.verified || false,
        };
      }),
      ...extraVendors.map(v => ({
        id: v.user_id,
        name: v.name || "Unnamed Vendor",
        type: "vendor",
        city: v.city || "—",
        plan: v.tier || "Basic",
        joined: new Date(v.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
        emoji: "",
        category: v.category || "—",
        verified: v.verified || false,
      })),
    ];

    setAllUsers(merged);
    setLoadingUsers(false);
  };

  const fetchPendingVendors = async () => {
    setLoadingVendors(true);
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPendingVendors(data.map(v => ({
        id: v.id,
        name: v.name,
        emoji: v.emoji || "",
        category: v.category || "",
        city: v.city || "",
        tier: v.tier || "Basic",
        joined: new Date(v.created_at).toLocaleDateString(),
        statement: v.faith_statement || "",
        checks: {
          faith: !!(v.faith_statement),
          email: true,
          license: false,
          insurance: false,
          portfolio: false,
        },
      })));
    }
    setLoadingVendors(false);
  };

  // Approve: set verified=true in Supabase
  const approveVendor = async (id) => {
    const { error } = await supabase
      .from("vendors")
      .update({ verified: true })
      .eq("id", id);
    if (!error) {
      setPendingVendors(v => v.filter(x => x.id !== id));
      setModal(null);
      showToast("Vendor approved");
    } else {
      showToast("Error: " + error.message);
    }
  };

  const fetchVerificationApps = async () => {
    setLoadingVerifications(true);
    const { data, error } = await supabase
      .from("vendor_verifications")
      .select("*, vendors(name, category, city, verified)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setVerificationApps(data.map(a => ({
        id: a.id,
        vendorId: a.vendor_id,
        vendorName: a.vendors?.name || "Unknown Vendor",
        vendorCategory: a.vendors?.category || "—",
        vendorCity: a.vendors?.city || "—",
        tierGoal: a.tier_goal || "faith_verified",
        faithStatement: a.faith_statement || "",
        refChurch: a.ref_church_name || "",
        refPastor: a.ref_pastor_name || "",
        refEmail: a.ref_pastor_email || "",
        refPhone: a.ref_pastor_phone || "",
        refRelationship: a.ref_relationship || "",
        covenantSigned: a.covenant_signed || false,
        status: a.status || "pending",
        submitted: new Date(a.created_at).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"}),
      })));
    }
    setLoadingVerifications(false);
  };

  const approveVerification = async (app) => {
    // Update vendor_verifications status
    await supabase.from("vendor_verifications").update({ status: "approved" }).eq("id", app.id);
    // Set vendor as verified and clear pending status
    await supabase.from("vendors").update({ verified: true, verification_status: "approved" }).eq("id", app.vendorId);
    setVerificationApps(v => v.filter(x => x.id !== app.id));
    setExpandedApp(null);
    showToast(`${app.vendorName} is now Faith Verified`);
  };

  const rejectVerification = async (app) => {
    await supabase.from("vendor_verifications").update({ status: "rejected" }).eq("id", app.id);
    await supabase.from("vendors").update({ verification_status: "rejected" }).eq("id", app.vendorId);
    setVerificationApps(v => v.filter(x => x.id !== app.id));
    setExpandedApp(null);
    showToast(`Verification rejected for ${app.vendorName}`);
  };

  // Reject: delete from vendors table
  const rejectVendor = async (id) => {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", id);
    if (!error) {
      setPendingVendors(v => v.filter(x => x.id !== id));
      setModal(null);
      showToast("Vendor rejected");
    } else {
      showToast("Error: " + error.message);
    }
  };

  const resolveDispute = async (id, outcome) => {
    const { error } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        resolution: outcome,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error) {
      setDisputes(d => d.map(x => x.id === id ? {...x, status:"resolved", resolution: outcome} : x));
      showToast(`Dispute resolved — ${outcome}`);
    } else {
      showToast("Error: " + error.message);
    }
  };

  const updateDisputeStatus = async (id, status) => {
    const { error } = await supabase
      .from("disputes")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setDisputes(d => d.map(x => x.id === id ? {...x, status} : x));
      showToast(`Status updated to ${status}`);
    }
  };
  const VIEWS = {overview:"Overview",approvals:"Vendor Approvals",users:"User Management",revenue:"Revenue",disputes:"Dispute Center",settings:"Settings"};
  const maxBar = Math.max(...MRR_BARS.map(b=>b.v));
  // Use pendingVendors for approvals, fall back to PENDING_VENDORS_DATA for overview widget if empty
  const vendors = pendingVendors.length > 0 ? pendingVendors : loadingVendors ? [] : PENDING_VENDORS_DATA;
  return (
    <div className="admin-app">
      <aside className="admin-sidenav">
        {/* Brand */}
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid var(--aborder)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{fontFamily:"'Palatino Linotype',Palatino,'Book Antiqua',serif",fontSize:15,color:"var(--atext)",fontWeight:600,letterSpacing:"0.3px"}}>
              Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span>
            </div>
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",background:"rgba(245,240,232,0.07)",border:"1px solid rgba(245,240,232,0.12)",borderRadius:4,fontSize:9,fontWeight:700,color:"var(--gold-light)",letterSpacing:"1px",textTransform:"uppercase"}}>Admin Console</div>
        </div>

        {/* Nav */}
        <div className="admin-nav-section">
          <div className="admin-nav-label">Platform</div>
          {[
            {id:"overview",  label:"Overview"},
            {id:"approvals", label:"Approvals", badge:(pendingVendors.length + verificationApps.length)||null, badgeColor:"amber"},
            {id:"users",     label:"Users"},
            {id:"revenue",   label:"Revenue"},
            {id:"disputes",  label:"Disputes", badge:disputes.filter(d=>d.status!=="resolved").length||null, badgeColor:"red"},
            {id:"settings",  label:"Settings"},
          ].map(n=>(
            <div key={n.id} className={`admin-nav-item${adminView===n.id?" active":""}`} onClick={()=>setAdminView(n.id)}>
              <span style={{flex:1}}>{n.label}</span>
              {n.badge ? <span className={`anav-badge${n.badgeColor==="amber"?" amber":""}`}>{n.badge}</span> : null}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{marginTop:"auto",padding:"14px 12px",borderTop:"1px solid var(--aborder)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.03)"}}>
            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,var(--gold),var(--gold-light))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--abg)",flexShrink:0}}>A</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>Admin</div>
              <div style={{fontSize:10,color:"var(--atext-muted)"}}>Platform Owner</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:10,color:"var(--atext-muted)",fontWeight:600,letterSpacing:1,textTransform:"uppercase"}}>Admin</div>
            <div style={{color:"var(--aborder2)",fontSize:12}}>/</div>
            <div className="admin-topbar-title">{VIEWS[adminView]}</div>
          </div>
          <div className="admin-topbar-right">
            <div className="status-pill"><span className="pulse"/>Operational</div>
            <button className="admin-btn" onClick={()=>showToast("Exporting data...")}>Export</button>
            {(pendingVendors.length+disputes.filter(d=>d.status!=="resolved").length) > 0 && (
              <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,fontSize:10,fontWeight:600,color:"var(--red)"}}>
                {pendingVendors.length+disputes.filter(d=>d.status!=="resolved").length} alerts
              </div>
            )}
          </div>
        </div>

        <div className="admin-content">
          {/* ── OVERVIEW ── */}
          {adminView==="overview" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>Dashboard</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>Platform Overview</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Real-time metrics across your marketplace.</div>
              </div>
              <div className="kpi-grid">
                {[
                  {color:"green", label:"Total Users",     val:kpis.totalUsers,        sub:`${kpis.churches} churches · ${kpis.vendors} vendors`},
                  {color:"blue",  label:"Active Projects", val:kpis.activeProjects,    sub:"Open & accepting bids"},
                  {color:"gold",  label:"Total Vendors",   val:kpis.verifiedVendors,   sub:`${pendingVendors.length} pending approval`},
                  {color:"purple",label:"Revenue",         val:"—",                    sub:"Connect Stripe to track"},
                ].map((k,i)=>(
                  <div key={i} className={`kpi-card ${k.color}`}>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-val">{k.val}</div>
                    <div className="kpi-sub">{k.sub}</div>
                  </div>
                ))}
              </div>
              <div className="admin-two-col">
                <div className="panel">
                  <div className="panel-hd"><div className="panel-title">Monthly Recurring Revenue</div></div>
                  <div className="panel-body">
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",marginBottom:3}}>$4,830 <span style={{fontSize:13,color:"var(--green)",fontFamily:"DM Sans,sans-serif",fontWeight:600}}>↑ 23%</span></div>
                    <div style={{fontSize:11,color:"var(--atext-muted)",marginBottom:12}}>vs $3,920 last month</div>
                    <div className="mini-chart">
                      {MRR_BARS.map((b,i)=>(
                        <div key={i} className="bar-wrap">
                          <div className="bar" style={{height:`${(b.v/maxBar)*52}px`,background:i===MRR_BARS.length-1?"linear-gradient(180deg,var(--gold-light),var(--gold))":"rgba(232,224,208,0.25)"}}/>
                          <div className="bar-label">{b.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="panel">
                  <div className="panel-hd"><div className="panel-title">Live Activity</div></div>
                  <div className="panel-body" style={{padding:"6px 16px"}}>
                    <AdminActivityFeed/>
                  </div>
                </div>
              </div>
              <div className="admin-three-col">
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">✦ Pending Approvals <span className="badge badge-amber" style={{marginLeft:4}}>{pendingVendors.length}</span></div><button className="panel-action" onClick={()=>setAdminView("approvals")}>Review all</button></div>
                  <div className="panel-body" style={{padding:"8px 12px"}}>
                    {pendingVendors.slice(0,3).map(v=>(
                      <div key={v.id} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:"1px solid var(--aborder)"}}>
                        <div style={{width:30,height:30,borderRadius:7,background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{v.emoji}</div>
                        <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:"var(--atext)"}}>{v.name}</div><div style={{fontSize:10,color:"var(--atext-muted)"}}>{v.joined}</div></div>
                        <span className={`badge ${v.tier==="Pro"?"badge-gold":"badge-muted"}`}>{v.tier}</span>
                      </div>
                    ))}
                    {pendingVendors.length===0&&<div style={{padding:"16px 0",textAlign:"center",fontSize:11,color:"var(--atext-muted)"}}>All caught up ✓</div>}
                  </div>
                </div>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Open Disputes</div><button className="panel-action" onClick={()=>setAdminView("disputes")}>Manage</button></div>
                  <div className="panel-body" style={{padding:"8px 12px"}}>
                    {disputes.filter(d=>d.status!=="resolved").map(d=>(
                      <div key={d.id} style={{padding:"7px 0",borderBottom:"1px solid var(--aborder)"}}>
                        <div style={{fontSize:11,fontWeight:600,color:d.urgent?"var(--red)":"var(--atext)",marginBottom:2}}>{d.urgent?"":""}{d.title}</div>
                        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:"var(--atext-muted)"}}>{d.church} vs {d.vendor}</span><span style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"var(--amber)"}}>{d.amount}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="panel" style={{marginBottom:0}}>
                  <div className="panel-hd"><div className="panel-title">Platform Health</div></div>
                  <div className="panel-body">
                    {HEALTH_DATA.map((h,i)=>(
                      <div key={i} className="health-row">
                        <div className="health-label">{h.label}</div>
                        <div className="health-track"><div className="health-fill" style={{width:`${Math.min(h.val,100)}%`,background:h.color}}/></div>
                        <div className="health-val" style={{color:h.color}}>{h.val}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── APPROVALS ── */}
          {adminView==="approvals" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>Vendor Approvals</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>Review Applications</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Faith-verify new vendors before they appear in the directory.</div>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
                {[{label:"Pending",val:pendingVendors.length,color:"var(--amber)"},{label:"Approved Today",val:"—",color:"var(--green)"},{label:"Rejected Today",val:"—",color:"var(--red)"},{label:"Avg Review Time",val:"<1hr",color:"var(--blue2)"}].map((s,i)=>(
                  <div key={i} style={{flex:1,minWidth:110,background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:9,padding:"11px 14px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>{s.label}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {loadingVendors
                ? <div style={{textAlign:"center",padding:"40px",color:"var(--atext-muted)"}}>Loading applications...</div>
                : pendingVendors.length===0
                  ? <div style={{textAlign:"center",padding:"50px 40px",color:"var(--atext-muted)"}}><div style={{fontSize:14,fontWeight:600,color:"var(--atext)",marginBottom:5}}>All approvals cleared</div><div style={{fontSize:11,color:"var(--atext-muted)"}}>New vendor signups will appear here.</div></div>
                  : <div className="panel">
                    <div className="panel-hd"><div className="panel-title">Applications — {pendingVendors.length} pending</div></div>
                    <div style={{overflowX:"auto"}}>
                      <table className="data-table" style={{minWidth:600}}>
                        <thead><tr style={{background:"var(--abg3)"}}>{["","Vendor","Category","Plan","Faith Statement","Actions"].map((h,i)=><th key={i} style={{padding:"10px 14px 8px"}}>{h}</th>)}</tr></thead>
                        <tbody>
                          {pendingVendors.map(v=>(
                            <tr key={v.id}>
                              <td style={{padding:"9px 14px",width:36}}><div style={{width:32,height:32,borderRadius:8,background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>{v.emoji}</div></td>
                              <td style={{padding:"9px 8px"}}><div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{v.name}</div><div style={{fontSize:10,color:"var(--atext-muted)"}}>{v.city} · {v.joined}</div></td>
                              <td style={{padding:"9px 8px"}}><span className="badge badge-muted">{(v.category||"").split(" ")[0]||"—"}</span></td>
                              <td style={{padding:"9px 8px"}}><span className={`badge ${v.tier==="Pro"?"badge-gold":"badge-muted"}`}>{v.tier}</span></td>
                              <td style={{padding:"9px 8px",maxWidth:200}}>
                                <div style={{fontSize:10,color:"var(--atext-mid)",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {v.statement ? `"${v.statement.slice(0,60)}${v.statement.length>60?"...":""}"` : <span style={{color:"var(--atext-muted)"}}>None provided</span>}
                                </div>
                              </td>
                              <td style={{padding:"9px 14px"}}>
                                <div style={{display:"flex",gap:4}}>
                                  <button className="act-btn act-approve" onClick={()=>approveVendor(v.id)}>✓ Approve</button>
                                  <button className="act-btn act-view" onClick={()=>setModal(v)}>Review</button>
                                  <button className="act-btn act-reject" onClick={()=>rejectVendor(v.id)}>✕ Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
              }

              {/* ── FAITH VERIFICATION APPLICATIONS ── */}
              <div style={{marginTop:32}}>
                <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Faith Verification</div>
                    <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--atext)"}}>Verification Applications</div>
                    <div style={{fontSize:12,color:"var(--atext-muted)",marginTop:2}}>Vendors who have completed the 5-step faith verification flow.</div>
                  </div>
                  {verificationApps.length > 0 && (
                    <div style={{padding:"5px 14px",background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:100,fontSize:12,fontWeight:700,color:"var(--amber)"}}>{verificationApps.length} pending</div>
                  )}
                </div>

                {loadingVerifications ? (
                  <div style={{padding:"30px",textAlign:"center",color:"var(--atext-muted)",fontSize:12}}>Loading verification applications...</div>
                ) : verificationApps.length === 0 ? (
                  <div style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:12,padding:"36px",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"var(--atext)",marginBottom:4}}>No pending verification applications</div>
                    <div style={{fontSize:11,color:"var(--atext-muted)"}}>When vendors complete the faith verification flow, applications appear here.</div>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {verificationApps.map(app=>(
                      <div key={app.id} style={{background:"var(--abg2)",border:`1px solid ${expandedApp===app.id?"var(--gold-border)":"var(--aborder)"}`,borderRadius:14,overflow:"hidden",transition:"border-color 0.2s"}}>
                        {/* Row header */}
                        <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setExpandedApp(expandedApp===app.id?null:app.id)}>
                          <div style={{width:36,height:36,borderRadius:9,background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"var(--gold-light)",flexShrink:0}}>
                            {app.vendorName.slice(0,1)}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:"var(--atext)",marginBottom:2}}>{app.vendorName}</div>
                            <div style={{fontSize:11,color:"var(--atext-muted)"}}>{app.vendorCategory} · {app.vendorCity} · Submitted {app.submitted}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <div style={{padding:"3px 10px",borderRadius:100,background:app.tierGoal==="elder_endorsed"?"rgba(168,85,247,0.12)":"rgba(232,224,208,0.08)",border:`1px solid ${app.tierGoal==="elder_endorsed"?"rgba(168,85,247,0.3)":"rgba(232,224,208,0.2)"}`,fontSize:10,fontWeight:700,color:app.tierGoal==="elder_endorsed"?"#c084fc":"var(--gold-light)",letterSpacing:0.5}}>
                              {app.tierGoal==="elder_endorsed"?"Elder Endorsed":"Faith Verified"}
                            </div>
                            <div style={{fontSize:12,color:"var(--atext-muted)",transition:"transform 0.2s",transform:expandedApp===app.id?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expandedApp===app.id && (
                          <div style={{borderTop:"1px solid var(--aborder)",padding:"20px"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                              {/* Faith statement */}
                              <div style={{background:"var(--abg3)",borderRadius:10,padding:"14px 16px"}}>
                                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Faith Statement</div>
                                <div style={{fontSize:12,color:"var(--atext-mid)",lineHeight:1.7,fontStyle:"italic"}}>
                                  {app.faithStatement ? `"${app.faithStatement}"` : <span style={{color:"var(--atext-muted)"}}>Not provided</span>}
                                </div>
                              </div>
                              {/* Ministry reference */}
                              <div style={{background:"var(--abg3)",borderRadius:10,padding:"14px 16px"}}>
                                <div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Ministry Reference</div>
                                {[
                                  {label:"Church", val:app.refChurch},
                                  {label:"Pastor", val:app.refPastor},
                                  {label:"Email", val:app.refEmail},
                                  {label:"Phone", val:app.refPhone||"—"},
                                  {label:"Relationship", val:app.refRelationship||"—"},
                                ].map((item,i)=>(
                                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                                    <span style={{fontSize:10,color:"var(--atext-muted)",width:70,flexShrink:0}}>{item.label}</span>
                                    <span style={{fontSize:11,color:"var(--atext)",fontWeight:500}}>{item.val||"—"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Covenant */}
                            <div style={{padding:"10px 14px",borderRadius:8,background:app.covenantSigned?"rgba(34,197,94,0.06)":"rgba(239,68,68,0.06)",border:`1px solid ${app.covenantSigned?"var(--green-border)":"var(--red-border)"}`,marginBottom:16,fontSize:12,color:app.covenantSigned?"var(--green)":"var(--red)",fontWeight:600}}>
                              {app.covenantSigned ? "Vendor Covenant signed" : "Vendor Covenant not signed"}
                            </div>
                            {/* Action buttons */}
                            <div style={{display:"flex",gap:10}}>
                              <button
                                onClick={()=>approveVerification(app)}
                                style={{padding:"10px 22px",background:"var(--green)",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"opacity 0.2s"}}
                                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                              >Approve Verification</button>
                              <button
                                onClick={()=>rejectVerification(app)}
                                style={{padding:"10px 22px",background:"transparent",color:"var(--red)",border:"1px solid var(--red-border)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}
                              >Reject</button>
                              <a href={`mailto:${app.refEmail}?subject=KingdomBid%20Vendor%20Reference%20Check&body=Hi%20${encodeURIComponent(app.refPastor)}%2C%0A%0AWe%20received%20a%20faith%20verification%20application%20from%20${encodeURIComponent(app.vendorName)}%20on%20KingdomBid.%20They%20listed%20you%20as%20a%20ministry%20reference.%0A%0ACould%20you%20briefly%20confirm%3A%0A1.%20How%20long%20have%20you%20known%20${encodeURIComponent(app.vendorName)}%3F%0A2.%20Would%20you%20vouch%20for%20their%20character%20and%20faith%3F%0A3.%20Have%20they%20served%20your%20ministry%3F%0A%0AThank%20you%20for%20your%20time.%0A%0AKingdomBid%20Team`}
                                style={{padding:"10px 20px",background:"var(--abg3)",color:"var(--atext-mid)",border:"1px solid var(--aborder)",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif",textDecoration:"none",display:"inline-flex",alignItems:"center"}}
                              >Email Reference</a>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ambassador & Partner Apps */}
              <AmbassadorAppsPanel showToast={showToast}/>
              <PartnerAppsPanel showToast={showToast}/>
            </>
          )}

          {/* ── USERS ── */}
          {adminView==="users" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>User Management</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>All Users</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Every church and vendor registered on the platform.</div>
              </div>
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-title">All Users <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"var(--atext-muted)",fontWeight:400,marginLeft:6}}>{allUsers.length} total</span></div>
                <button className="panel-action" onClick={()=>showToast("CSV export coming soon")}>Export CSV</button>
              </div>
              {loadingUsers ? (
                <div style={{padding:"30px",textAlign:"center",color:"var(--atext-muted)",fontSize:12}}>Loading users...</div>
              ) : allUsers.length === 0 ? (
                <div style={{padding:"32px",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--atext)",marginBottom:8}}>Users not loading</div>
                  <div style={{fontSize:12,color:"var(--atext-muted)",lineHeight:1.7,maxWidth:440,margin:"0 auto 16px"}}>
                    Supabase Row Level Security (RLS) is blocking the admin from reading other users' profiles. Run this one-line SQL fix in your Supabase SQL Editor:
                  </div>
                  <div style={{background:"var(--abg3)",border:"1px solid var(--aborder2)",borderRadius:8,padding:"12px 16px",fontFamily:"DM Mono,monospace",fontSize:12,color:"var(--gold-light)",textAlign:"left",maxWidth:500,margin:"0 auto",lineHeight:1.8}}>
                    create policy "Admin read all profiles"<br/>
                    &nbsp;&nbsp;on profiles for select using (true);
                  </div>
                  <div style={{fontSize:11,color:"var(--atext-muted)",marginTop:12}}>After running that SQL, refresh this page and your users will appear here.</div>
                </div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table className="data-table" style={{minWidth:500}}>
                    <thead><tr>{["","Name","Type","Plan","Location","Joined","Actions"].map((h,i)=><th key={i} style={{padding:"9px 14px 7px"}}>{h}</th>)}</tr></thead>
                    <tbody>
                      {allUsers.map((u,i)=>(
                        <tr key={u.id||i}>
                          <td style={{padding:"9px 14px",width:36}}><div style={{width:30,height:30,borderRadius:8,background:u.type==="church"?"linear-gradient(135deg,#162032,#1E3050)":"linear-gradient(135deg,#7C3C00,#B25800)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{u.emoji}</div></td>
                          <td style={{padding:"9px 8px"}}>
                            <div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{u.name}</div>
                            {u.category && <div style={{fontSize:10,color:"var(--atext-muted)"}}>{u.category}</div>}
                          </td>
                          <td style={{padding:"9px 8px"}}><span className={`badge ${u.type==="church"?"badge-blue":"badge-gold"}`}>{u.type}</span></td>
                          <td style={{padding:"9px 8px"}}>
                            {u.verified
                              ? <span style={{fontSize:10,fontWeight:700,color:"var(--gold-light)",background:"rgba(232,224,208,0.08)",padding:"2px 8px",borderRadius:100,border:"1px solid rgba(232,224,208,0.2)"}}>Verified</span>
                              : <span style={{fontFamily:"DM Mono,monospace",fontSize:11,color:"var(--atext-mid)"}}>{u.plan}</span>
                            }
                          </td>
                          <td style={{padding:"9px 8px",fontSize:11,color:"var(--atext-muted)"}}>{u.city}</td>
                          <td style={{padding:"9px 8px",fontSize:10,color:"var(--atext-muted)",fontFamily:"DM Mono,monospace"}}>{u.joined}</td>
                          <td style={{padding:"9px 14px"}}><div style={{display:"flex",gap:4}}><button className="act-btn act-view" onClick={()=>showToast(`Viewing ${u.name}`)}>View</button><button className="act-btn act-reject" onClick={()=>showToast(`${u.name} suspended`)}>Suspend</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </>
          )}

          {/* ── REVENUE ── */}
          {adminView==="revenue" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>Revenue</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>Financial Overview</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Connect Stripe to see live revenue data.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[{label:"MRR",val:"$4,830",color:"var(--green)"},{label:"ARR Projected",val:"$57,960",color:"var(--gold-light)"},{label:"Active Subscribers",val:"120",color:"var(--blue2)"}].map((k,i)=>(
                  <div key={i} style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:7}}>{k.label}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:24,fontWeight:700,color:k.color}}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div className="panel">
                <div className="panel-hd"><div className="panel-title">Subscription Tiers</div></div>
                <div className="panel-body">
                  {[{name:"Basic",price:"$29/mo",count:62,mrr:"$1,798",pct:37},{name:"Pro",price:"$49/mo",count:54,mrr:"$2,646",pct:55},{name:"Elite",price:"$99/mo",count:4,mrr:"$396",pct:8}].map((t,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"var(--abg3)",borderRadius:7,marginBottom:7}}>
                      <div><div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{t.name}</div><div style={{fontSize:10,color:"var(--atext-muted)"}}>{t.count} vendors</div></div>
                      <div style={{flex:1,margin:"0 16px"}}><div style={{height:4,background:"var(--abg4)",borderRadius:2,overflow:"hidden"}}><div style={{width:`${t.pct}%`,height:"100%",background:"linear-gradient(90deg,var(--gold),var(--gold-light))",borderRadius:2}}/></div></div>
                      <div style={{textAlign:"right"}}><div style={{fontFamily:"DM Mono,monospace",fontSize:12,color:"var(--gold-light)"}}>{t.price}</div><div style={{fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:600,color:"var(--green)"}}>{t.mrr}</div></div>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 12px",background:"var(--abg)",borderRadius:7,marginTop:4}}><div style={{fontSize:12,color:"var(--atext-mid)"}}>Total MRR</div><div style={{fontFamily:"DM Mono,monospace",fontSize:17,fontWeight:700,color:"var(--green)"}}>$4,830</div></div>
                </div>
              </div>
            </>
          )}

          {/* ── DISPUTES ── */}
          {adminView==="disputes" && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>Dispute Center</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>Active Disputes</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Mediate conflicts between churches and vendors.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
                {[
                  {label:"Open",        val:disputes.filter(d=>d.status==="open").length,         color:"var(--red)"},
                  {label:"Investigating",val:disputes.filter(d=>d.status==="investigating").length, color:"var(--amber)"},
                  {label:"In Mediation", val:disputes.filter(d=>d.status==="mediation").length,    color:"var(--blue2)"},
                ].map((s,i)=>(
                  <div key={i} style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:9,padding:"12px 16px"}}>
                    <div style={{fontSize:9,color:"var(--atext-muted)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:5}}>{s.label}</div>
                    <div style={{fontFamily:"DM Mono,monospace",fontSize:26,fontWeight:700,color:s.color}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {loadingDisputes ? (
                <div style={{padding:"40px",textAlign:"center",color:"var(--atext-muted)",fontSize:12}}>Loading disputes...</div>
              ) : disputes.length === 0 ? (
                <div style={{textAlign:"center",padding:"50px 40px",color:"var(--atext-muted)"}}>
                  <div style={{width:32,height:2,background:"rgba(255,255,255,0.1)",borderRadius:2,margin:"0 auto 10px",opacity:0.3}}></div>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--atext)",marginBottom:5}}>No disputes</div>
                  <div style={{fontSize:11}}>Disputes opened by churches or vendors will appear here.</div>
                </div>
              ) : (
                disputes.map(d=>(
                  <div key={d.id} className={`dispute-card${d.urgent?" urgent":""}`}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:7,gap:10}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:600,color:d.urgent?"var(--red)":"var(--atext)"}}>{d.urgent?"":""}{d.title}</div>
                        <div style={{fontSize:10,color:"var(--atext-muted)",marginTop:2}}>Opened {d.opened} · <span style={{color:"var(--amber)",fontFamily:"DM Mono,monospace"}}>{d.amount}</span></div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {d.status!=="resolved" && (
                          <select
                            value={d.status}
                            onChange={e=>updateDisputeStatus(d.id, e.target.value)}
                            style={{fontSize:10,padding:"3px 7px",borderRadius:5,border:"1px solid var(--aborder2)",background:"var(--abg3)",color:"var(--atext)",fontFamily:"DM Sans,sans-serif",cursor:"pointer"}}
                          >
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="mediation">Mediation</option>
                          </select>
                        )}
                        <span className={`badge ${d.status==="open"?"badge-red":d.status==="investigating"?"badge-amber":d.status==="mediation"?"badge-blue":"badge-green"}`}>
                          {d.status==="resolved"?"✓ Resolved":d.status}
                        </span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:7,marginBottom:9}}>
                      <span style={{padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:500,background:"rgba(30,48,80,0.5)",color:"rgba(255,255,255,0.6)",border:"1px solid var(--aborder)"}}>CH {d.church}</span>
                      <span style={{fontSize:10,color:"var(--atext-muted)",alignSelf:"center"}}>vs</span>
                      <span style={{padding:"3px 9px",borderRadius:6,fontSize:10,fontWeight:500,background:"rgba(232,224,208,0.08)",color:"var(--gold-light)",border:"1px solid rgba(232,224,208,0.2)"}}> {d.vendor}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--atext-mid)",lineHeight:1.6,marginBottom:10,fontWeight:300}}>{d.body}</div>
                    {d.status!=="resolved" && (
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <button className="act-btn act-approve" onClick={()=>resolveDispute(d.id,"Refund issued")}>✓ Refund Church</button>
                        <button className="act-btn act-view" onClick={()=>resolveDispute(d.id,"Payment released")}>Release to Vendor</button>
                        <button className="act-btn" style={{background:"var(--amber-bg)",color:"var(--amber)",border:"1px solid var(--amber-border)"}} onClick={()=>showToast("Mediation email sent")}>Mediation</button>
                      </div>
                    )}
                    {d.status==="resolved" && <div style={{fontSize:11,color:"var(--green)",fontWeight:600}}>✓ Resolved{d.resolution ? ` — ${d.resolution}` : ""}</div>}
                  </div>
                ))
              )}
            </>
          )}

          {/* ── SETTINGS ── */}
          {adminView==="settings" && (
            <div style={{maxWidth:600}}>
              <div style={{marginBottom:28}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:8}}>Settings</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--atext)",letterSpacing:-0.5,marginBottom:4}}>Platform Settings</div>
                <div style={{fontSize:13,color:"var(--atext-muted)",fontWeight:300}}>Configure pricing, notifications, and platform behavior.</div>
              </div>
              <div className="panel">
                <div className="panel-hd"><div className="panel-title">Pricing Configuration</div></div>
                <div className="panel-body">
                  <div style={{fontSize:11,color:"var(--atext-muted)",marginBottom:14,lineHeight:1.6}}>These reflect what's shown on the public pricing page. Edit and save to update platform fees.</div>
                  {[
                    {label:"Churches",val:"$0",suffix:"forever",note:"Always free — churches never pay"},
                    {label:"Vendor Free Tier",val:"$0",suffix:"to start",note:"10 bids/month, 10% platform fee"},
                    {label:"Vendor Pro Plan",val:"$19",suffix:"/mo",note:"Unlimited bids, featured placement, Faith Verified badge"},
                    {label:"Platform Fee (vendor)",val:"10",suffix:"%",note:"Capped at $200 max per project"},
                    {label:"Ministry Fund Contribution",val:"1",suffix:"%",note:"Of every commission, donated to ministry fund"},
                    {label:"Referral Credit",val:"$50",suffix:"per gig",note:"Paid to referrer when referred member lands first gig"},
                  ].map((f,i)=>(
                    <div key={i} style={{padding:"11px 0",borderBottom:"1px solid var(--aborder)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                        <div style={{fontSize:12,fontWeight:600,color:"var(--atext)"}}>{f.label}</div>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <input defaultValue={f.val} style={{width:64,padding:"5px 9px",background:"var(--abg3)",border:"1px solid var(--aborder2)",borderRadius:6,color:"var(--atext)",fontFamily:"DM Mono,monospace",fontSize:12,outline:"none",textAlign:"right"}}/>
                          <span style={{fontSize:11,color:"var(--atext-muted)",minWidth:40}}>{f.suffix}</span>
                        </div>
                      </div>
                      <div style={{fontSize:10,color:"var(--atext-muted)"}}>{f.note}</div>
                    </div>
                  ))}
                  <button className="act-btn act-approve" style={{marginTop:14,padding:"8px 16px"}} onClick={()=>showToast("Pricing saved")}>Save Pricing</button>
                </div>
              </div>
              <div className="panel">
                <div className="panel-hd"><div className="panel-title">Platform Toggles</div></div>
                <div className="panel-body">
                  <ToggleRow label="Email Notifications" sub="Send emails for signups and bids" defaultOn={true}/>
                  <ToggleRow label="Auto-Approve Vendors" sub="Approve vendors that pass all checks" defaultOn={false}/>
                  <ToggleRow label="Stripe Test Mode" sub="Currently in test — no real charges" defaultOn={true}/>
                  <ToggleRow label="Maintenance Mode" sub="Takes the platform offline" defaultOn={false} danger/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {modal&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><div className="modal-title">Review Vendor Application</div><button className="modal-close" onClick={()=>setModal(null)}>×</button></div>
            <div className="modal-body">
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:11,background:"var(--abg4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--atext)",letterSpacing:0.5}}>{modal.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:"var(--atext)"}}>{modal.name}</div><div style={{fontSize:11,color:"var(--atext-muted)"}}>{modal.category} · {modal.city}</div></div>
                <span className={`badge ${modal.tier==="Pro"?"badge-gold":"badge-muted"}`} style={{marginLeft:"auto"}}>{modal.tier}</span>
              </div>
              <div style={{marginBottom:14}}><div style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:5}}>Faith Statement</div><div style={{fontSize:12,color:"var(--atext-mid)",fontStyle:"italic"}}>"{modal.statement}"</div></div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Faith Statement</div>
                {modal.statement
                  ? <div style={{fontSize:12,color:"var(--atext-mid)",fontStyle:"italic",lineHeight:1.6,padding:"10px 12px",background:"var(--abg3)",borderRadius:7}}>"{modal.statement}"</div>
                  : <div style={{fontSize:12,color:"var(--atext-muted)"}}>No faith statement provided.</div>
                }
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:8}}>Details</div>
                {[{label:"Category",val:modal.category||"—"},{label:"City",val:modal.city||"—"},{label:"Tier",val:modal.tier||"Basic"},{label:"Applied",val:modal.joined||"—"}].map((item,i)=>(
                  <div key={i} className="checklist-item">
                    <span style={{color:"var(--atext-muted)",width:80,flexShrink:0}}>{item.label}</span>
                    <span style={{color:"var(--atext)"}}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-deny-modal" onClick={()=>rejectVendor(modal.id)}>✕ Reject</button>
              <button className="btn-approve-modal" onClick={()=>approveVendor(modal.id)}>✓ Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   VENDOR VERIFICATION FLOW
   Dynamic multi-step faith verification application
══════════════════════════════════ */
function VendorVerificationFlow({ currentUser, vendorRow, showToast, onVerified }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(vendorRow?.verification_status === "pending" || vendorRow?.verified);
  const [form, setForm] = useState({
    faithStatement: vendorRow?.faith_statement || "",
    churchName: "",
    pastorName: "",
    pastorEmail: "",
    pastorPhone: "",
    relationship: "",
    covenantSigned: false,
    tierGoal: "faith_verified",
  });
  const setF = (k, v) => setForm(f => ({...f, [k]: v}));

  const COVENANT_ITEMS = [
    "I serve as unto the Lord — bringing excellence to every ministry I work with.",
    "I operate with integrity in my pricing, timeline, and capabilities.",
    "I represent my faith in how I conduct business and handle conflict.",
    "I am an active member of a local church and welcome accountability.",
    "I agree to KingdomBid's community standards and understand verification can be reviewed.",
  ];

  const TIERS = [
    {id:"faith_verified", label:"Faith Verified", desc:"Faith statement + one ministry reference. Most common.", color:"var(--gold-text)", bg:"var(--gold-pale)", border:"var(--gold)"},
    {id:"elder_endorsed", label:"Elder Endorsed", desc:"Pastoral letter uploaded. Highest trust signal on the platform.", color:"#7c3aed", bg:"#f5f3ff", border:"#8b5cf6"},
  ];

  const STEPS = [
    {num:1, label:"Tier"},
    {num:2, label:"Statement"},
    {num:3, label:"Reference"},
    {num:4, label:"Covenant"},
    {num:5, label:"Submit"},
  ];

  const canProceed = () => {
    if (step === 1) return !!form.tierGoal;
    if (step === 2) return form.faithStatement.length >= 80;
    if (step === 3) return form.churchName && form.pastorName && form.pastorEmail;
    if (step === 4) return form.covenantSigned;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await supabase.from("vendor_verifications").insert({
        vendor_id: vendorRow?.id,
        user_id: currentUser?.id,
        tier_goal: form.tierGoal,
        faith_statement: form.faithStatement,
        ref_church_name: form.churchName,
        ref_pastor_name: form.pastorName,
        ref_pastor_email: form.pastorEmail,
        ref_pastor_phone: form.pastorPhone,
        ref_relationship: form.relationship,
        covenant_signed: true,
        status: "pending",
      });
      // Mark vendor as pending
      await supabase.from("vendors").update({ verification_status: "pending" }).eq("id", vendorRow?.id);
      setSubmitted(true);
      if (onVerified) onVerified();
    } catch(e) {
      showToast("Error submitting — please try again");
    }
    setSubmitting(false);
  };

  // Already verified
  if (vendorRow?.verified) {
    return (
      <div>
        <div style={{background:"linear-gradient(135deg,var(--navy),#1a2e12)",borderRadius:20,padding:"48px",textAlign:"center",marginBottom:20}}>
          <div style={{width:64,height:64,borderRadius:16,background:"rgba(232,224,208,0.12)",border:"1px solid rgba(232,224,208,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 20px"}}>✓</div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:28,fontWeight:700,color:"white",marginBottom:8}}>Faith Verified</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",fontWeight:300,maxWidth:360,margin:"0 auto 24px",lineHeight:1.7}}>Your vendor profile is verified. This badge appears on your public profile and in search results.</div>
          <div style={{display:"inline-flex",padding:"6px 20px",borderRadius:100,background:"rgba(232,224,208,0.1)",border:"1px solid rgba(232,224,208,0.2)"}}>
            <span style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",letterSpacing:1}}>FAITH VERIFIED</span>
          </div>
        </div>
        <div style={{background:"white",borderRadius:14,border:"1px solid var(--border)",padding:"20px 24px",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>★</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:3}}>Upgrade to Elder Endorsed</div>
            <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5}}>Upload a pastoral letter to unlock the highest trust tier on the platform.</div>
          </div>
          <button className="btn-secondary" style={{flexShrink:0,marginLeft:"auto"}} onClick={()=>{setForm(f=>({...f,tierGoal:"elder_endorsed"}));setSubmitted(false);setStep(3);}}>Apply</button>
        </div>
      </div>
    );
  }

  // Already submitted / pending
  if (submitted) {
    return (
      <div style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,var(--gold-pale),var(--cream-dark))",border:"2px solid var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold-text)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <div style={{fontFamily:"Playfair Display,serif",fontSize:26,fontWeight:700,color:"var(--navy)",marginBottom:8}}>Application Under Review</div>
        <div style={{fontSize:14,color:"var(--text-muted)",fontWeight:300,maxWidth:400,margin:"0 auto 28px",lineHeight:1.7}}>Our team reviews every application within 48 hours. We'll contact your ministry reference and notify you by email once approved.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,maxWidth:340,margin:"0 auto"}}>
          {[
            {label:"Faith statement", done:true},
            {label:"Ministry reference submitted", done:true},
            {label:"Vendor Covenant signed", done:true},
            {label:"Reference contacted by KingdomBid", done:false},
            {label:"Verification approved", done:false},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:item.done?"var(--success-bg)":"var(--cream)",borderRadius:9,border:`1px solid ${item.done?"var(--success-border)":"var(--border)"}`}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:item.done?"var(--success)":"var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"white",flexShrink:0,fontWeight:700}}>{item.done?"✓":""}</div>
              <span style={{fontSize:12,color:item.done?"var(--success)":"var(--text-muted)",fontWeight:item.done?600:400}}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <div className="eyebrow">Faith Verification</div>
        <h2 style={{fontFamily:"Playfair Display,serif",fontSize:24,fontWeight:700,color:"var(--navy)",marginBottom:6}}>Apply for Verification</h2>
        <p style={{fontSize:13,color:"var(--text-muted)",fontWeight:300,lineHeight:1.6,maxWidth:500}}>Verified vendors receive more inquiries, higher trust from churches, and a badge on their public profile. Takes about 3 minutes.</p>
      </div>

      {/* Step progress bar */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:36}}>
        {STEPS.map((s,i)=>(
          <div key={s.num} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"auto"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:s.num<step?"pointer":"default"}} onClick={()=>s.num<step&&setStep(s.num)}>
              <div style={{width:32,height:32,borderRadius:"50%",background:step===s.num?"var(--navy)":step>s.num?"var(--success)":"var(--cream-dark)",border:step===s.num?"2px solid var(--navy)":step>s.num?"2px solid var(--success)":"2px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>=s.num?"white":"var(--text-muted)",transition:"all 0.3s"}}>
                {step>s.num?"✓":s.num}
              </div>
              <div style={{fontSize:10,fontWeight:step===s.num?700:400,color:step===s.num?"var(--navy)":"var(--text-muted)",letterSpacing:0.3,whiteSpace:"nowrap"}}>{s.label}</div>
            </div>
            {i<STEPS.length-1&&<div style={{flex:1,height:2,background:step>s.num?"var(--success)":"var(--border)",margin:"0 6px",marginBottom:18,transition:"background 0.3s"}}/>}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div style={{animation:"fadeUp 0.3s ease"}}>

        {/* Step 1: Choose tier */}
        {step===1&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Which tier are you applying for?</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20,lineHeight:1.5}}>You can always upgrade later. Most vendors start with Faith Verified.</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {TIERS.map(t=>(
                <div key={t.id} onClick={()=>setF("tierGoal",t.id)} style={{padding:"20px 22px",borderRadius:14,border:`2px solid ${form.tierGoal===t.id?t.border:"var(--border)"}`,background:form.tierGoal===t.id?t.bg:"white",cursor:"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",gap:16}}>
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${form.tierGoal===t.id?t.border:"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                    {form.tierGoal===t.id&&<div style={{width:10,height:10,borderRadius:"50%",background:t.border}}/>}
                  </div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,color:"var(--navy)",marginBottom:3}}>{t.label}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",fontWeight:300}}>{t.desc}</div>
                  </div>
                  <div style={{marginLeft:"auto",padding:"3px 10px",borderRadius:100,background:t.bg,border:`1px solid ${t.border}40`,fontSize:10,fontWeight:700,color:t.color,flexShrink:0}}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Faith Statement */}
        {step===2&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Your Faith Statement</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20,lineHeight:1.5}}>This will appear publicly on your profile. Write from the heart — churches read this carefully. Minimum 80 characters.</div>
            <div className="field">
              <textarea
                rows={6}
                value={form.faithStatement}
                onChange={e=>setF("faithStatement",e.target.value)}
                placeholder="How does your faith shape the way you work? How has God called you to serve ministries through your skills? What does it mean to you to work in Kingdom-aligned spaces?..."
                style={{fontSize:13,lineHeight:1.8}}
              />
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <div style={{fontSize:11,color:form.faithStatement.length<80?"var(--danger)":"var(--success)",fontWeight:500}}>
                  {form.faithStatement.length<80?`${80-form.faithStatement.length} more characters needed`:"Looks great"}
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{form.faithStatement.length} chars</div>
              </div>
            </div>
            <div style={{padding:"12px 16px",background:"var(--cream)",borderRadius:9,border:"1px solid var(--border)",fontSize:12,color:"var(--text-muted)",lineHeight:1.6}}>
              Tip: The most compelling faith statements share a specific story — a moment when your faith shaped a business decision, or a ministry that changed how you think about your work.
            </div>
          </div>
        )}

        {/* Step 3: Ministry Reference */}
        {step===3&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Ministry Reference</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20,lineHeight:1.5}}>Provide one pastor or ministry leader who can vouch for your character and faith. We'll send them a short 3-question email — they don't need to be on the platform.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="field" style={{marginBottom:0}}><label>Church / Ministry Name *</label><input value={form.churchName} onChange={e=>setF("churchName",e.target.value)} placeholder="Grace Fellowship Church"/></div>
              <div className="field" style={{marginBottom:0}}><label>Pastor / Leader Name *</label><input value={form.pastorName} onChange={e=>setF("pastorName",e.target.value)} placeholder="Pastor David M."/></div>
              <div className="field" style={{marginBottom:0}}><label>Their Email Address *</label><input type="email" value={form.pastorEmail} onChange={e=>setF("pastorEmail",e.target.value)} placeholder="pastor@gracefellowship.com"/></div>
              <div className="field" style={{marginBottom:0}}><label>Their Phone (optional)</label><input value={form.pastorPhone} onChange={e=>setF("pastorPhone",e.target.value)} placeholder="(214) 555-0123"/></div>
            </div>
            <div className="field" style={{marginTop:14}}>
              <label>Your relationship to this leader</label>
              <input value={form.relationship} onChange={e=>setF("relationship",e.target.value)} placeholder="e.g. Active member for 4 years, served on worship team"/>
            </div>
            <div style={{padding:"12px 16px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:9,fontSize:12,color:"var(--info)",lineHeight:1.6}}>
              We'll send your reference a short, professional email from KingdomBid asking 3 simple questions about your character and faith. The email is respectful and takes them under 2 minutes to respond.
            </div>
          </div>
        )}

        {/* Step 4: Covenant */}
        {step===4&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>The Vendor Covenant</div>
            <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:20,lineHeight:1.5}}>Read and sign the 5 commitments that define what it means to be a KingdomBid vendor. This is not a legal document — it is a values commitment.</div>
            <div style={{border:"1px solid rgba(42,53,32,0.09)",borderRadius:12,overflow:"hidden",marginBottom:20}}>
              {COVENANT_ITEMS.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 20px",borderBottom:i<COVENANT_ITEMS.length-1?"1px solid var(--border)":"none",background:"white"}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"var(--cream-dark)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--text-muted)",flexShrink:0,marginTop:1}}>0{i+1}</div>
                  <div style={{fontSize:13,color:"var(--text-mid)",lineHeight:1.65,fontWeight:300}}>{item}</div>
                </div>
              ))}
            </div>
            <div
              onClick={()=>setF("covenantSigned",!form.covenantSigned)}
              style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",background:form.covenantSigned?"var(--success-bg)":"var(--cream)",borderRadius:12,border:`2px solid ${form.covenantSigned?"var(--success-border)":"var(--border)"}`,cursor:"pointer",transition:"all 0.2s"}}
            >
              <div style={{width:24,height:24,borderRadius:6,background:form.covenantSigned?"var(--success)":"white",border:`2px solid ${form.covenantSigned?"var(--success)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"white",flexShrink:0,transition:"all 0.2s",fontWeight:700}}>{form.covenantSigned?"✓":""}</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:form.covenantSigned?"var(--success)":"var(--navy)"}}>I have read and I sign the KingdomBid Vendor Covenant</div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>By checking this box you are making a values commitment to the ministry community.</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step===5&&(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:20}}>Review your application before submitting.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {[
                {label:"Tier", value:TIERS.find(t=>t.id===form.tierGoal)?.label},
                {label:"Ministry reference", value:`${form.pastorName} — ${form.churchName}`},
                {label:"Reference email", value:form.pastorEmail},
                {label:"Faith statement", value:`${form.faithStatement.length} characters written`},
                {label:"Covenant", value:"Signed"},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 16px",background:"white",borderRadius:9,border:"1px solid var(--border)"}}>
                  <span style={{fontSize:12,color:"var(--text-muted)",fontWeight:500}}>{item.label}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"14px 18px",background:"var(--cream)",borderRadius:10,border:"1px solid var(--border)",fontSize:13,color:"var(--text-mid)",lineHeight:1.7,marginBottom:24}}>
              After you submit, our team reviews your application within <strong>48 hours</strong>. Your ministry reference will receive an email from KingdomBid. You'll be notified by email once approved.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{display:"flex",gap:10,marginTop:28,alignItems:"center"}}>
        {step>1&&<button className="btn-secondary" onClick={()=>setStep(s=>s-1)}>← Back</button>}
        {step<5
          ? <button className="btn-primary" disabled={!canProceed()} style={{opacity:canProceed()?1:0.45}} onClick={()=>setStep(s=>s+1)}>Continue</button>
          : <button className="btn-primary" disabled={submitting||!canProceed()} onClick={handleSubmit} style={{padding:"11px 28px"}}>{submitting?"Submitting...":"Submit Application"}</button>
        }
        {!canProceed()&&step<5&&<span style={{fontSize:11,color:"var(--text-muted)"}}>
          {step===2?"Write at least 80 characters":step===3?"Fill in all required fields":step===4?"Sign the covenant to continue":""}
        </span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   NOTIFICATION BELL
══════════════════════════════════ */
function NotificationBell({currentUser, nav}){
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const parseNotif = (n) => ({
    id: n.id,
    title: n.title || n.text || "Notification",
    body: n.body || "",
    type: n.type || "info",
    link: n.link || null,
    read: n.read || false,
    time: (() => {
      const d = new Date(n.created_at);
      const diff = (Date.now() - d) / 1000;
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
    })(),
  });

  useEffect(()=>{
    if(!currentUser) return;
    supabase.from("notifications").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(15)
      .then(({data})=>setNotifs((data||[]).map(parseNotif)));
    const sub = supabase.channel("notifs_"+currentUser.id)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:`user_id=eq.${currentUser.id}`},
        p=>setNotifs(n=>[parseNotif(p.new),...n.slice(0,14)])
      ).subscribe();
    return ()=>sub.unsubscribe();
  },[currentUser]);

  useEffect(()=>{
    const h=(e)=>{if(bellRef.current&&!bellRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const markAllRead=async()=>{
    await supabase.from("notifications").update({read:true}).eq("user_id",currentUser.id).eq("read",false);
    setNotifs(n=>n.map(x=>({...x,read:true})));
  };

  const handleClick = async (n) => {
    if (!n.read) {
      await supabase.from("notifications").update({read:true}).eq("id",n.id);
      setNotifs(ns=>ns.map(x=>x.id===n.id?{...x,read:true}:x));
    }
    if (n.link) { setOpen(false); nav(n.link); }
  };

  const typeIcon = (type) => {
    const s = {width:16,height:16,flexShrink:0,marginTop:1};
    if (type==="new_bid") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    if (type==="review_prompt") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    if (type==="bid_accepted") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>;
    if (type==="new_message") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    if (type==="milestone") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
    return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  };

  const unread=notifs.filter(n=>!n.read).length;

  return (
    <div ref={bellRef} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:34,height:34,borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",background:open?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.05)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0,transition:"all 0.2s"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {unread>0&&<div style={{position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:"50%",background:"var(--danger)",border:"2px solid var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"white"}}>{unread>9?"9+":unread}</div>}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:320,background:"white",border:"1px solid var(--border)",borderRadius:14,boxShadow:"0 16px 48px rgba(0,0,0,0.14)",zIndex:300,overflow:"hidden",animation:"fadeUp 0.15s ease"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>Notifications {unread>0&&<span style={{marginLeft:6,padding:"1px 7px",background:"var(--danger)",color:"white",borderRadius:100,fontSize:10,fontWeight:700}}>{unread}</span>}</div>
            {unread>0&&<button onClick={markAllRead} style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Mark all read</button>}
          </div>
          <div style={{maxHeight:340,overflowY:"auto"}}>
            {notifs.length===0
              ?<div style={{padding:"32px",textAlign:"center"}}>
                <div style={{width:24,height:2,background:"rgba(255,255,255,0.15)",borderRadius:2,margin:"0 auto 8px"}}/>
                <div style={{fontSize:13,fontWeight:600,color:"var(--navy)",marginBottom:4}}>All caught up</div>
                <div style={{fontSize:12,color:"var(--text-muted)"}}>Notifications for bids, messages, and reviews will appear here.</div>
              </div>
              :notifs.map(n=>(
                <div key={n.id} onClick={()=>handleClick(n)} style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",background:n.read?"white":"var(--gold-pale)",display:"flex",gap:10,alignItems:"flex-start",cursor:n.link?"pointer":"default",transition:"background 0.15s"}} onMouseEnter={e=>{if(n.link)e.currentTarget.style.background=n.read?"var(--cream)":"rgba(232,224,208,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.background=n.read?"white":"var(--gold-pale)";}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:7,background:"var(--cream)",flexShrink:0}}>{typeIcon(n.type)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:"var(--navy)",marginBottom:2}}>{n.title}</div>
                    {n.body&&<div style={{fontSize:11,color:"var(--text-muted)",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{n.body}</div>}
                    <div style={{fontSize:10,color:"var(--text-muted)",marginTop:4,display:"flex",alignItems:"center",gap:6}}>
                      {n.time}
                      {n.link&&<span style={{color:"var(--navy)",fontWeight:600}}>→ View</span>}
                    </div>
                  </div>
                  {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:"var(--navy)",flexShrink:0,marginTop:4}}/>}
                </div>
              ))
            }
          </div>
          {notifs.length>0&&<div style={{padding:"10px 16px",borderTop:"1px solid var(--border)",textAlign:"center"}}>
            <button onClick={()=>{setOpen(false);nav("projects");}} style={{fontSize:11,color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Go to Dashboard →</button>
          </div>}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   AMBASSADOR APPLICATIONS PANEL (admin)
══════════════════════════════════ */
function AmbassadorAppsPanel({showToast}){
  const [apps,setApps]=useState([]);
  const [loading,setLoading]=useState(true);
  const [expanded,setExpanded]=useState(null);

  useEffect(()=>{
    supabase.from("ambassador_applications").select("*").eq("status","pending").order("created_at",{ascending:false})
      .then(({data})=>{setApps(data||[]);setLoading(false);});
  },[]);

  const approve=async(id,name)=>{
    await supabase.from("ambassador_applications").update({status:"approved"}).eq("id",id);
    setApps(a=>a.filter(x=>x.id!==id));
    showToast(`${name} approved as Ambassador`);
  };
  const decline=async(id)=>{
    await supabase.from("ambassador_applications").update({status:"declined"}).eq("id",id);
    setApps(a=>a.filter(x=>x.id!==id));
    showToast("Application declined");
  };

  if(loading) return null;
  if(apps.length===0) return (
    <div style={{marginTop:32}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Ambassador Program</div>
      <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--atext)",marginBottom:10}}>Ambassador Applications</div>
      <div style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:12,padding:"24px",textAlign:"center",fontSize:12,color:"var(--atext-muted)"}}>No pending ambassador applications</div>
    </div>
  );

  return (
    <div style={{marginTop:32}}>
      <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Ambassador Program</div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--atext)"}}>Ambassador Applications</div>
        </div>
        <div style={{padding:"4px 12px",borderRadius:100,background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",fontSize:12,fontWeight:700,color:"var(--amber)"}}>{apps.length} pending</div>
      </div>
      {apps.map(app=>(
        <div key={app.id} style={{background:"var(--abg2)",border:`1px solid ${expanded===app.id?"var(--gold-border)":"var(--aborder)"}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpanded(expanded===app.id?null:app.id)}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--atext)",marginBottom:2}}>{app.name}</div>
              <div style={{fontSize:11,color:"var(--atext-muted)"}}>{app.email} · {app.school}</div>
            </div>
            <div style={{fontSize:11,color:"var(--atext-muted)"}}>{new Date(app.created_at).toLocaleDateString()}</div>
            <div style={{fontSize:11,color:"var(--atext-muted)"}}>{expanded===app.id?"▴":"▾"}</div>
          </div>
          {expanded===app.id&&(
            <div style={{borderTop:"1px solid var(--aborder)",padding:"16px 18px"}}>
              {app.ministry&&<div style={{marginBottom:10}}><div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:4}}>Ministry</div><div style={{fontSize:12,color:"var(--atext-mid)"}}>{app.ministry}</div></div>}
              <div style={{marginBottom:14}}><div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:4}}>Why They Want to Ambassador</div><div style={{fontSize:12,color:"var(--atext-mid)",lineHeight:1.7,fontStyle:"italic"}}>"{app.why}"</div></div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>approve(app.id,app.name)} style={{padding:"8px 18px",background:"var(--green)",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Approve</button>
                <button onClick={()=>decline(app.id)} style={{padding:"8px 16px",background:"transparent",color:"var(--red)",border:"1px solid var(--red-border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Decline</button>
                <a href={`mailto:${app.email}?subject=Your KingdomBid Ambassador Application`} style={{padding:"8px 16px",background:"var(--abg3)",color:"var(--atext-mid)",border:"1px solid var(--aborder)",borderRadius:8,fontSize:12,fontFamily:"DM Sans,sans-serif",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Email</a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════
   PARTNER APPLICATIONS PANEL (admin)
══════════════════════════════════ */
function PartnerAppsPanel({showToast}){
  const [apps,setApps]=useState([]);
  const [loading,setLoading]=useState(true);
  const [expanded,setExpanded]=useState(null);

  useEffect(()=>{
    supabase.from("partner_applications").select("*").eq("status","pending").order("created_at",{ascending:false})
      .then(({data})=>{setApps(data||[]);setLoading(false);});
  },[]);

  const approve=async(id,name)=>{
    await supabase.from("partner_applications").update({status:"approved"}).eq("id",id);
    setApps(a=>a.filter(x=>x.id!==id));
    showToast(`${name} approved as Partner`);
  };
  const decline=async(id)=>{
    await supabase.from("partner_applications").update({status:"declined"}).eq("id",id);
    setApps(a=>a.filter(x=>x.id!==id));
    showToast("Application declined");
  };

  if(loading) return null;
  if(apps.length===0) return (
    <div style={{marginTop:24}}>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Partnerships</div>
      <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--atext)",marginBottom:10}}>Partnership Inquiries</div>
      <div style={{background:"var(--abg2)",border:"1px solid var(--aborder)",borderRadius:12,padding:"24px",textAlign:"center",fontSize:12,color:"var(--atext-muted)"}}>No pending partnership inquiries</div>
    </div>
  );

  return (
    <div style={{marginTop:24}}>
      <div style={{marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"var(--gold-light)",opacity:0.7,marginBottom:6}}>Partnerships</div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--atext)"}}>Partnership Inquiries</div>
        </div>
        <div style={{padding:"4px 12px",borderRadius:100,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",fontSize:12,fontWeight:700,color:"var(--blue2)"}}>{apps.length} pending</div>
      </div>
      {apps.map(app=>(
        <div key={app.id} style={{background:"var(--abg2)",border:`1px solid ${expanded===app.id?"rgba(59,130,246,0.3)":"var(--aborder)"}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>setExpanded(expanded===app.id?null:app.id)}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--atext)"}}>{app.org}</div>
                <div style={{padding:"2px 8px",borderRadius:100,background:"rgba(59,130,246,0.1)",fontSize:9,fontWeight:700,color:"var(--blue2)"}}>{(app.partner_type||"church").toUpperCase()}</div>
              </div>
              <div style={{fontSize:11,color:"var(--atext-muted)"}}>{app.name} · {app.email}</div>
            </div>
            <div style={{fontSize:11,color:"var(--atext-muted)"}}>{expanded===app.id?"▴":"▾"}</div>
          </div>
          {expanded===app.id&&(
            <div style={{borderTop:"1px solid var(--aborder)",padding:"16px 18px"}}>
              {app.message&&<div style={{marginBottom:14}}><div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--atext-muted)",marginBottom:4}}>Message</div><div style={{fontSize:12,color:"var(--atext-mid)",lineHeight:1.7}}>{app.message}</div></div>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>approve(app.id,app.org)} style={{padding:"8px 18px",background:"var(--green)",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Approve</button>
                <button onClick={()=>decline(app.id)} style={{padding:"8px 16px",background:"transparent",color:"var(--red)",border:"1px solid var(--red-border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Decline</button>
                <a href={`mailto:${app.email}?subject=Your KingdomBid Partnership Inquiry`} style={{padding:"8px 16px",background:"var(--abg3)",color:"var(--atext-mid)",border:"1px solid var(--aborder)",borderRadius:8,fontSize:12,fontFamily:"DM Sans,sans-serif",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>Reply</a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* Toggle helper extracted to avoid hooks-in-loop error */
function ToggleRow({label, sub, defaultOn, danger}){
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--aborder)"}}>
      <div><div style={{fontSize:12,fontWeight:500,color:danger?"var(--red)":"var(--atext)"}}>{label}</div><div style={{fontSize:10,color:"var(--atext-muted)",marginTop:2}}>{sub}</div></div>
      <div onClick={()=>setOn(v=>!v)} style={{width:36,height:20,borderRadius:100,background:on?(danger?"var(--red)":"var(--green)"):"var(--abg4)",border:"1px solid var(--aborder2)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:2,left:on?17:2,width:14,height:14,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   AVAILABILITY CALENDAR
   Fully dynamic — reads/writes to Supabase `vendor_availability` table
   Schema: id, vendor_id, date (ISO string), status ('available'|'unavailable')
══════════════════════════════════ */
function AvailabilityCalendar({ vendorId, editable = false, showToast }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [avail, setAvail] = useState({}); // { "2025-06-15": "available" | "unavailable" }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  useEffect(() => {
    if (!vendorId) { setLoading(false); return; }
    fetchAvailability();
  }, [vendorId]);

  const fetchAvailability = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendor_availability")
      .select("date, status")
      .eq("vendor_id", vendorId);
    if (data) {
      const map = {};
      data.forEach(row => { map[row.date] = row.status; });
      setAvail(map);
    }
    setLoading(false);
  };

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDow = (y, m) => new Date(y, m, 1).getDay();

  const fmt = (d) => {
    const y2 = year, m2 = String(month + 1).padStart(2, "0"), d2 = String(d).padStart(2, "0");
    return `${y2}-${m2}-${d2}`;
  };

  const isToday = (d) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };
  const isPast = (d) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const cycleDay = async (d) => {
    if (!editable || isPast(d)) return;
    const key = fmt(d);
    const cur = avail[key] || "default";
    const next = cur === "default" ? "available" : cur === "available" ? "unavailable" : "default";
    const newAvail = { ...avail };
    if (next === "default") {
      delete newAvail[key];
    } else {
      newAvail[key] = next;
    }
    setAvail(newAvail);

    setSaving(true);
    try {
      if (next === "default") {
        await supabase.from("vendor_availability").delete().eq("vendor_id", vendorId).eq("date", key);
      } else {
        const { data: existing } = await supabase.from("vendor_availability").select("id").eq("vendor_id", vendorId).eq("date", key).maybeSingle();
        if (existing) {
          await supabase.from("vendor_availability").update({ status: next }).eq("vendor_id", vendorId).eq("date", key);
        } else {
          await supabase.from("vendor_availability").insert({ vendor_id: vendorId, date: key, status: next });
        }
      }
      if (showToast) showToast("Availability updated");
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const days = getDaysInMonth(year, month);
  const offset = getFirstDow(year, month);

  // Count available days this month
  const availCount = Object.entries(avail).filter(([k,v]) => k.startsWith(`${year}-${String(month+1).padStart(2,"0")}`) && v === "available").length;

  return (
    <div className="avail-cal">
      <div className="avail-cal-header">
        <div>
          <div className="avail-cal-title">{MONTHS[month]} {year}</div>
          {availCount > 0 && (
            <div style={{fontSize:11,color:"var(--success)",marginTop:2,fontWeight:500}}>{availCount} available day{availCount !== 1 ? "s" : ""} this month</div>
          )}
        </div>
        <div className="avail-cal-nav">
          <button onClick={prevMonth}>‹</button>
          <button onClick={nextMonth}>›</button>
        </div>
      </div>
      <div className="avail-cal-grid">
        <div className="avail-cal-dow">
          {DOW.map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="avail-cal-days">
          {Array.from({length: offset}).map((_,i) => (
            <div key={`e${i}`} className="avail-day empty"/>
          ))}
          {Array.from({length: days}).map((_, i) => {
            const d = i + 1;
            const key = fmt(d);
            const status = avail[key] || "default";
            const past = isPast(d);
            const tod = isToday(d);
            let cls = "avail-day";
            if (tod) cls += " today";
            else if (past) cls += " past";
            else cls += " " + status;
            return (
              <div key={d} className={cls} onClick={() => cycleDay(d)} title={editable && !past ? "Click to toggle availability" : ""}>
                {d}
              </div>
            );
          })}
        </div>
      </div>
      <div className="avail-legend">
        <div className="avail-legend-item"><div className="avail-legend-dot" style={{background:"rgba(34,197,94,0.3)",border:"1px solid rgba(34,197,94,0.4)"}}/>Available</div>
        <div className="avail-legend-item"><div className="avail-legend-dot" style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.2)"}}/>Unavailable</div>
        {editable && <div className="avail-legend-item" style={{marginLeft:"auto",color:"var(--gold-text)",fontSize:10}}>Click days to toggle</div>}
        {saving && <div className="avail-legend-item" style={{color:"var(--text-muted)"}}>Saving…</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   MATCHING SCREEN
   Surfaces best-fit vendors for churches (and best-fit projects for vendors)
   using category, budget, location, availability, rating signals
══════════════════════════════════ */
function MatchingScreen({ role, currentUser, nav }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    loadMatches();
  }, [currentUser, role]);

  const loadMatches = async () => {
    setLoading(true);
    if (role === "church") {
      // Get church's recent project categories to find best vendors
      const { data: projs } = await supabase.from("projects").select("category,budget").eq("church_id", currentUser.id).limit(5);
      const { data: vendorsRaw } = await supabase.from("vendors").select("*").eq("verified", true).order("created_at", { ascending: false }).limit(40);
      const cats = (projs || []).map(p => p.category).filter(Boolean);
      const scored = (vendorsRaw || []).map(v => {
        let score = 50;
        const reasons = [];
        if (cats.includes(v.category)) { score += 30; reasons.push({ icon: "→", text: `Matches your ${v.category} project` }); }
        if (v.verified) { score += 10; reasons.push({ icon: "✓", text: "Faith Verified vendor" }); }
        if ((v.reviews_count || 0) >= 5 && (v.rating || 5) >= 4.8) { score += 8; reasons.push({ icon: "★", text: `${Number(v.rating||5).toFixed(1)} star rating` }); }
        if (v.tier === "Pro") { score += 5; reasons.push({ icon: "◆", text: "Pro member" }); }
        if ((v.projects_count || 0) >= 5) reasons.push({ icon: "→", text: `${v.projects_count}+ completed projects` });
        return { ...v, score: Math.min(score, 99), reasons };
      }).sort((a,b) => b.score - a.score).slice(0, 12);
      setMatches(scored);
    } else {
      // Vendor: show best-fit open projects
      const { data: vendorRow } = await supabase.from("vendors").select("*").eq("user_id", currentUser.id).maybeSingle();
      const { data: projsRaw } = await supabase.from("projects").select("*").eq("status","open").order("posted_at",{ascending:false}).limit(40);
      const scored = (projsRaw || []).map(p => {
        let score = 40;
        const reasons = [];
        if (vendorRow?.category && p.category === vendorRow.category) { score += 35; reasons.push({ icon: "→", text: "Matches your service category" }); }
        if (p.urgent) { score += 10; reasons.push({ icon: "!", text: "Urgent project — less competition" }); }
        if ((p.bids_count || 0) < 3) { score += 8; reasons.push({ icon: "→", text: `Only ${p.bids_count || 0} bids so far` }); }
        else reasons.push({ icon: "→", text: `${p.bids_count || 0} competing bids` });
        if (vendorRow?.city && p.city && p.city.split(",")[1]?.trim() === vendorRow.city?.split(",")[1]?.trim()) {
          score += 7; reasons.push({ icon: "→", text: "Same state as you" });
        }
        reasons.push({ icon: "$", text: p.budget || "Budget TBD" });
        return { ...p, score: Math.min(score, 99), reasons, isProject: true };
      }).sort((a,b) => b.score - a.score).slice(0, 12);
      setMatches(scored);
    }
    setLoading(false);
  };

  const scoreColor = (s) => s >= 80 ? "var(--success)" : s >= 60 ? "var(--warn)" : "var(--text-muted)";
  const scoreLabel = (s) => s >= 80 ? "Excellent Match" : s >= 60 ? "Good Match" : "Possible Match";

  return (
    <div className="page">
      {/* Dark screen header */}
      <div className="screen-header hd-matches">
        <div className="screen-header-bg"/>
        <div className="screen-header-content">
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
            <div>
              <div className="screen-header-eyebrow">Smart Matching</div>
              <div className="screen-header-title">{role === "church" ? "Recommended Vendors" : "Matched Projects"}</div>
              <div className="screen-header-sub">{role === "church" ? "Ranked by category fit, rating, and availability." : "Scored by category, location, and your bid history."}</div>
            </div>
            <button onClick={loadMatches} className="btn-header">↻ Refresh</button>
          </div>
        </div>
      </div>

      {/* How it works — compact strip */}
      <div style={{background:"white",borderRadius:12,padding:"13px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12,border:"1px solid rgba(42,53,32,0.09)",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
        <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6,fontWeight:300}}>
          <strong style={{color:"var(--navy)",fontWeight:600}}>{role === "church" ? "How matches work:" : "How scoring works:"}</strong>{" "}
          {role === "church"
            ? "Your project categories, past hires, and budget range are used to rank the most relevant verified vendors."
            : "Open projects are scored by category match, location, bid competition, and urgency."}
        </div>
      </div>

      {!currentUser && (
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(42,53,32,0.09)",padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:8}}>Sign in to see your matches</div>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24,lineHeight:1.7}}>Your personalized matches are based on your project history, category, and location.</div>
          <button className="btn-primary" onClick={()=>nav("auth")}>Sign In →</button>
        </div>
      )}
      {currentUser && loading ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[1,2,3,4].map(i=>(
            <div key={i} style={{background:"white",borderRadius:12,border:"1px solid rgba(42,53,32,0.09)",padding:"18px 20px",display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"var(--cream-dark)",flexShrink:0,animation:"skeleton 1.5s ease infinite"}}/>
              <div style={{flex:1}}>
                <div style={{height:15,width:"50%",background:"var(--cream-dark)",borderRadius:6,marginBottom:8,animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{height:11,width:"35%",background:"var(--cream-dark)",borderRadius:6,marginBottom:8,animation:"skeleton 1.5s ease infinite"}}/>
                <div style={{height:11,width:"70%",background:"var(--cream-dark)",borderRadius:6,animation:"skeleton 1.5s ease infinite"}}/>
              </div>
            </div>
          ))}
        </div>
      ) : currentUser && matches.length === 0 ? (
        <div style={{background:"white",borderRadius:16,border:"1px solid rgba(42,53,32,0.09)",padding:"60px 40px",textAlign:"center",boxShadow:"0 1px 3px rgba(42,53,32,0.04)"}}>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:20,fontWeight:700,color:"var(--navy)",marginBottom:8}}>No matches yet</div>
          <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:24,lineHeight:1.7,maxWidth:400,margin:"0 auto 24px"}}>
            {role === "church" ? "Post your first project to unlock personalized vendor recommendations." : "Complete your vendor profile with your category and location to start receiving matched projects."}
          </div>
          <button className="btn-primary" onClick={() => nav(role === "church" ? "projects" : "profile")}>
            {role === "church" ? "Post a Project →" : "Complete Profile →"}
          </button>
        </div>
      ) : currentUser && (
        <div className="match-card-list">
          {matches.map((m, i) => (
            <div key={m.id || i} className="match-card" style={{cursor:"pointer"}} onClick={() => nav(m.isProject ? "projects" : "vendors")}>
              <div className="match-score-ring" style={{border:`2.5px solid ${scoreColor(m.score)}`}}>
                <div className="match-score-text" style={{color:scoreColor(m.score)}}>{m.score}%</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--navy)"}}>{m.name || m.title}</div>
                  {i < 3 && <span style={{padding:"1px 7px",borderRadius:100,background:i===0?"var(--gold-pale)":"var(--cream-dark)",color:i===0?"var(--gold-text)":"var(--text-muted)",fontSize:9,fontWeight:700,letterSpacing:0.5}}>#{i+1} PICK</span>}
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:100,background:`${scoreColor(m.score)}18`,color:scoreColor(m.score),border:`1px solid ${scoreColor(m.score)}35`}}>{scoreLabel(m.score)}</span>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6}}>{m.category || m.church_name || ""}{m.city ? ` · ${m.city}` : ""}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {(m.reasons||[]).slice(0,3).map((r,ri)=>(
                    <span key={ri} style={{fontSize:11,color:"var(--text-mid)",display:"flex",alignItems:"center",gap:3,padding:"2px 8px",background:"var(--cream)",borderRadius:100,border:"1px solid var(--border)"}}>
                      <span style={{fontSize:10}}>{r.icon}</span>{r.text}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                {!m.isProject && <span style={{fontSize:11,color:"var(--text-muted)"}}>★ {Number(m.rating||5).toFixed(1)} · {m.reviews_count||0} reviews</span>}
                {m.isProject && <span style={{fontSize:12,fontWeight:600,color:"var(--navy)"}}>{m.budget}</span>}
                <button className="btn-primary" style={{padding:"6px 14px",fontSize:11}} onClick={e=>{e.stopPropagation();nav(m.isProject?"projects":"vendors");}}>View →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   REFERRAL PANEL
   Shown on vendor dashboard / profile stats
   "Refer your first church or vendor who lands their first gig and get $50 in credit"
══════════════════════════════════ */
function ReferralPanel({ currentUser, showToast }) {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  const referralLink = currentUser ? `https://kingdombid.com/join?ref=${currentUser.id.slice(0,8)}` : "https://kingdombid.com/join";

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    loadReferrals();
  }, [currentUser]);

  const loadReferrals = async () => {
    setLoading(true);
    const { data } = await supabase.from("referrals").select("*").eq("referrer_id", currentUser.id).order("created_at", { ascending: false });
    if (data) {
      setReferrals(data);
      setCredits(data.filter(r => r.credited).reduce((sum, r) => sum + (r.credit_amount || 50), 0));
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (showToast) showToast("Referral link copied!");
  };

  const pending = referrals.filter(r => !r.credited);
  const earned = referrals.filter(r => r.credited);

  return (
    <div style={{marginBottom:20}}>
      {/* Hero card */}
      <div className="referral-card">
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(232,224,208,0.06)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-30,left:-20,width:120,height:120,borderRadius:"50%",background:"rgba(232,224,208,0.04)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:8}}>Referral Program</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:10}}>
            <div className="referral-amount">$50</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:8,lineHeight:1.5,maxWidth:220}}>in account credit, per successful referral</div>
          </div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.7,maxWidth:440,marginBottom:16}}>
            Refer a church or vendor — when they complete their first gig on KingdomBid, you receive <strong style={{color:"var(--gold-light)"}}>$50 in account credit</strong> applied to your platform fees.
          </div>
          <div className="referral-copy-box" onClick={copyLink}>
            <span className="referral-link">{referralLink}</span>
            <button className="referral-copy-btn">{copied ? "✓ Copied!" : "Copy Link"}</button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:"flex",gap:0,background:"white",border:"1.5px solid var(--border)",borderRadius:12,overflow:"hidden",marginTop:12}}>
        {[
          {label:"Total Referrals", val: referrals.length, color:"var(--navy)"},
          {label:"Pending Credit", val: pending.length, color:"var(--warn)"},
          {label:"Earned ($)", val: `$${credits}`, color:"var(--success)"},
        ].map((s,i) => (
          <div key={i} style={{flex:1,padding:"14px 16px",textAlign:"center",borderRight:i<2?"1px solid var(--border)":"none"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:10,color:"var(--text-muted)",fontWeight:600,letterSpacing:0.5,textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"18px 20px",marginTop:10}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>How It Works</div>
        {[
          {num:"1", title:"Share your link", desc:"Send your unique referral link to a church or Christian vendor you know."},
          {num:"2", title:"They join KingdomBid", desc:"They sign up using your link and create their profile."},
          {num:"3", title:"They land their first gig", desc:"Once they complete their first project on KingdomBid, your $50 credit is applied."},
        ].map((step, i) => (
          <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:i<2?"1px solid var(--border)":"none"}}>
            <div style={{width:28,height:28,borderRadius:8,background:"var(--navy)",color:"var(--gold-light)",fontFamily:"Playfair Display,serif",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{step.num}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:2}}>{step.title}</div>
              <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5}}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral activity */}
      {!loading && referrals.length > 0 && (
        <div style={{background:"white",borderRadius:12,border:"1px solid var(--border)",padding:"18px 20px",marginTop:10}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--text-muted)",marginBottom:12}}>Your Referrals</div>
          {referrals.map((r, i) => (
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:i<referrals.length-1?"1px solid var(--border)":"none"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>{r.referred_name || "New Member"}</div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{r.referred_role === "church" ? "Church" : "Vendor"} · Joined {new Date(r.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
              </div>
              <span style={{padding:"4px 12px",borderRadius:100,fontSize:11,fontWeight:600,background:r.credited?"var(--success-bg)":"var(--warn-bg)",color:r.credited?"var(--success)":"var(--warn)",border:`1px solid ${r.credited?"var(--success-border)":"var(--warn-border)"}`}}>
                {r.credited ? `+$${r.credit_amount||50} Earned` : "Pending First Gig"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   LEGAL & PROTECTION PANEL
   - Clear contractor language in terms
   - Optional NDA per engagement
   - Simple dispute resolution process
══════════════════════════════════ */
function LegalProtectionPanel({ role, showToast }) {
  const [ndaEnabled, setNdaEnabled] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null); // "terms" | "nda" | "dispute"

  const docs = [
    {
      id: "terms",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      title: "Independent Contractor Agreement",
      sub: "Defines the nature of church-vendor relationships",
      status: "Standard",
      statusColor: "var(--success)",
      required: true,
    },
    {
      id: "nda",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      title: "Non-Disclosure Agreement (NDA)",
      sub: "Optional confidentiality agreement between parties",
      status: ndaEnabled ? "Enabled" : "Optional",
      statusColor: ndaEnabled ? "var(--info)" : "var(--text-muted)",
      required: false,
    },
    {
      id: "dispute",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 9l9-7 9 7"/><path d="M5 20h14"/><path d="M5 11l-2 6h4l-2-6z"/><path d="M19 11l-2 6h4l-2-6z"/></svg>,
      title: "Dispute Resolution Process",
      sub: "How KingdomBid mediates disagreements",
      status: "Active",
      statusColor: "var(--success)",
      required: true,
    },
  ];

  const DOC_CONTENT = {
    terms: {
      title: "Independent Contractor Agreement",
      sections: [
        { heading: "1. Contractor Status", body: "The vendor (Contractor) is an independent contractor and not an employee, agent, partner, or joint venturer of the church (Client) or KingdomBid. Nothing in this agreement shall create an employer-employee relationship. The Contractor shall be solely responsible for all taxes, withholdings, insurance, and other statutory requirements." },
        { heading: "2. Scope of Services", body: "The Contractor agrees to perform the specific services outlined in the project posting and accepted bid. Any scope changes must be agreed upon in writing by both parties through the KingdomBid platform messaging system." },
        { heading: "3. Payment Terms", body: "Payment is processed through KingdomBid's secure payment system according to the milestones agreed upon at bid acceptance. KingdomBid collects a platform fee of up to 10% (capped at $200) from the Contractor upon project completion. The Church pays the full bid amount at hiring, held in escrow until milestone approval." },
        { heading: "4. Intellectual Property", body: "Upon full payment, all work product and intellectual property created under this agreement shall be assigned to the Client, unless otherwise specified in the project agreement. The Contractor retains the right to display the completed work in a portfolio." },
        { heading: "5. Confidentiality", body: "Both parties agree to keep confidential any proprietary information shared during the project. If an optional NDA has been enabled for this engagement, its terms supersede this general clause." },
        { heading: "6. Termination", body: "Either party may terminate this agreement with 7 days written notice through the platform. In the event of termination, the Client shall pay for all work completed up to the termination date. Disputes arising from termination will follow KingdomBid's Dispute Resolution Process." },
        { heading: "7. Governing Law", body: "This agreement shall be governed by the laws of the state where the project is performed. Both parties consent to binding arbitration through KingdomBid's Dispute Resolution Process before pursuing any legal action." },
      ]
    },
    nda: {
      title: "Non-Disclosure Agreement (NDA)",
      sections: [
        { heading: "Purpose", body: "This optional NDA can be enabled on a per-project basis when sensitive ministry information — such as financial data, strategic plans, pastoral matters, or congregation records — will be shared with the Contractor." },
        { heading: "Covered Information", body: "\"Confidential Information\" includes all non-public data, documents, communications, plans, financial records, and ministry strategies shared by either party in the course of this engagement. This does not include information that is publicly known or independently developed." },
        { heading: "Obligations", body: "The receiving party agrees to: (a) hold all Confidential Information in strict confidence; (b) not disclose it to any third party without prior written consent; (c) use it solely for the purpose of this engagement; (d) notify the disclosing party immediately of any unauthorized disclosure." },
        { heading: "Duration", body: "These confidentiality obligations survive the completion or termination of this agreement for a period of three (3) years." },
        { heading: "Faith Commitment", body: "KingdomBid vendors are faith-aligned professionals. We encourage all parties to approach this agreement with integrity and stewardship — honoring not just the letter of this agreement, but the spirit of trust." },
      ]
    },
    dispute: {
      title: "Dispute Resolution Process",
      sections: [
        { heading: "Step 1 — Direct Communication (0–3 days)", body: "When a dispute arises, both parties are first encouraged to resolve it directly through the KingdomBid messaging system. Most issues are resolved quickly at this stage. Both parties should document their positions clearly." },
        { heading: "Step 2 — KingdomBid Mediation (3–10 days)", body: "If direct communication fails, either party may escalate the dispute to KingdomBid by submitting a formal dispute through the platform. A KingdomBid team member will review the conversation history, deliverables, and milestone records, then provide a non-binding recommendation within 5 business days." },
        { heading: "Step 3 — Binding Arbitration (10+ days)", body: "If KingdomBid mediation does not resolve the dispute, both parties agree to binding arbitration through the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitrator's decision shall be final and enforceable in court." },
        { heading: "Escrow Protection", body: "KingdomBid holds payment in escrow during active disputes. Funds are only released when both parties confirm completion or when an arbitration decision is rendered. This protects both churches and vendors during the resolution process." },
        { heading: "No Retaliation", body: "Raising a dispute in good faith will not affect a vendor's standing or a church's ability to post projects. KingdomBid treats all dispute records as confidential." },
      ]
    }
  };

  return (
    <div>
      {activeDoc ? (
        <div>
          <button className="btn-back" onClick={() => setActiveDoc(null)}>← Back to Legal & Protection</button>
          <div style={{marginBottom:24}}>
            <div className="eyebrow">Legal Document</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"var(--navy)",marginBottom:4}}>{DOC_CONTENT[activeDoc].title}</h2>
            <div style={{fontSize:12,color:"var(--text-muted)"}}>KingdomBid Platform — Standard Terms</div>
          </div>
          <div className="card">
            <div className="card-body">
              {activeDoc === "nda" && (
                <div style={{padding:"12px 16px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:9,marginBottom:20,fontSize:13,color:"var(--info)"}}>
                  This NDA is optional and can be toggled on per-project in your settings.
                </div>
              )}
              {DOC_CONTENT[activeDoc].sections.map((s, i) => (
                <div key={i} style={{marginBottom:22,paddingBottom:22,borderBottom:i<DOC_CONTENT[activeDoc].sections.length-1?"1px solid var(--border)":"none"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:8}}>{s.heading}</div>
                  <div style={{fontSize:13,color:"var(--text-mid)",lineHeight:1.8,fontWeight:300}}>{s.body}</div>
                </div>
              ))}
              <div style={{marginTop:8,padding:"12px 16px",background:"var(--cream)",borderRadius:9,fontSize:12,color:"var(--text-muted)",borderLeft:"3px solid var(--gold)"}}>
                ✦ This document is provided for informational purposes. KingdomBid recommends consulting a licensed attorney for legal matters specific to your ministry or business.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{marginBottom:22}}>
            <div className="eyebrow">Legal & Protection</div>
            <h2 style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Contractor Protections</h2>
            <div style={{fontSize:14,color:"var(--text-muted)",fontWeight:300}}>Every engagement on KingdomBid is backed by clear contractor language, optional confidentiality agreements, and a fair dispute process.</div>
          </div>

          {/* NDA Global Toggle */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-hd"><div className="card-hd-title">NDA Settings</div></div>
            <div className="card-body">
              <div className="nda-toggle-row">
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--navy)"}}>Require NDA on all projects</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>All parties will sign a non-disclosure agreement before project details are shared.</div>
                </div>
                <div className="toggle-track" style={{background:ndaEnabled?"var(--success)":"var(--border)"}} onClick={() => { setNdaEnabled(v => !v); if(showToast) showToast(ndaEnabled ? "NDA requirement removed" : "NDA requirement enabled"); }}>
                  <div className="toggle-thumb" style={{left:ndaEnabled?21:3}}/>
                </div>
              </div>
              {ndaEnabled && (
                <div style={{padding:"10px 14px",background:"var(--info-bg)",border:"1px solid var(--info-border)",borderRadius:8,fontSize:12,color:"var(--info)",marginTop:10}}>
                  ✓ NDA required. All new project invitations will include an NDA for both parties to sign before details are shared.
                </div>
              )}
            </div>
          </div>

          {/* Document cards */}
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {docs.map(doc => (
              <div key={doc.id} className="legal-doc-card" onClick={() => setActiveDoc(doc.id)}>
                <div style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14}}>
                  <div className="legal-doc-icon">{doc.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <div style={{fontSize:14,fontWeight:700,color:"var(--navy)"}}>{doc.title}</div>
                      {doc.required && <span style={{fontSize:9,fontWeight:700,letterSpacing:0.5,background:"var(--cream-dark)",color:"var(--text-muted)",padding:"1px 7px",borderRadius:100}}>STANDARD</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>{doc.sub}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:doc.statusColor}}/>
                    <span style={{fontSize:11,fontWeight:600,color:doc.statusColor}}>{doc.status}</span>
                    <span style={{fontSize:14,color:"var(--text-muted)",marginLeft:4}}>›</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Faith note */}
          <div style={{padding:"16px 20px",background:"var(--cream)",borderRadius:12,border:"1px solid var(--border)",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>✦</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:4}}>Built on Trust</div>
              <div style={{fontSize:13,color:"var(--text-muted)",lineHeight:1.7,fontWeight:300}}>
                KingdomBid's legal framework is designed for faith-based relationships — where integrity matters as much as the contract. Our goal is to make every engagement clear, fair, and protected so both ministries and vendors can focus on what matters: the Kingdom.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   ONBOARDING SCREEN
   Full wizard for new users — church or vendor
══════════════════════════════════ */
function OnboardingScreen({role, currentUser, nav, showToast}){
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  const churchSteps = [
    {
      icon:"",
      title:"Welcome to KingdomBid",
      sub:"The only marketplace built exclusively for churches and faith-based ministries.",
      content: (
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
          {[
            {num:"01",title:"Post a project",body:"Describe what you need — AV, web design, graphic work, construction — and set your budget."},
            {num:"02",title:"Receive bids",body:"Verified Christian vendors will submit proposals. You compare and choose who's the best fit."},
            {num:"03",title:"Hire with confidence",body:"Every vendor has signed the Vendor Covenant. Your payment is protected in escrow."},
          ].map((c,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"rgba(255,255,255,0.06)",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.25)",paddingTop:3,flexShrink:0,letterSpacing:1}}>{c.num}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:4}}>{c.title}</div><div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{c.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Tell us about your church",
      sub:"This helps vendors understand who they'll be serving.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{padding:"20px 24px",background:"rgba(255,255,255,0.06)",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:12}}>Your church profile is visible to vendors</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.7}}>
              <div>✓ Name & location are shown on each project</div>
              <div>✓ Denomination helps vendors understand your culture</div>
              <div>✓ Vendors research churches before bidding — a complete profile gets better bids</div>
            </div>
          </div>
          <div style={{padding:"14px 18px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,fontSize:12,color:"rgba(34,197,94,0.8)"}}>
            ✓ Your profile was saved during signup. You can update it anytime in Profile → Settings.
          </div>
        </div>
      ),
    },
    {
      icon:"",
      title:"Post your first project",
      sub:"It's free, takes 3 minutes, and you'll have bids within 24 hours.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {num:"01",label:"Choose a category",body:"AV & Media, Web & Tech, Construction, Graphic Design, Accounting, and more."},
              {num:"02",label:"Set your budget",body:"Give a range — vendors use this to self-qualify. No surprise invoices."},
              {num:"03",label:"Describe the work",body:"The more detail you add, the better the bids you receive."},
              {num:"04",label:"Receive bids & message vendors",body:"Built-in messaging keeps everything in one place."},
            ].map((s,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"36px 1fr",gap:12,padding:"14px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)"}}>
                <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.2)",paddingTop:3}}>{s.num}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:3}}>{s.label}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{s.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon:"",
      title:"You're all set.",
      sub:"Your ministry is now connected to hundreds of faith-aligned professionals.",
      content:(
        <div style={{marginTop:32,textAlign:"center"}}>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            {[["Post a Project","projects"],["Browse Vendors","vendors"]].map(([label,screen],i)=>(
              <button key={i} onClick={()=>{markComplete();nav(screen);}} style={{padding:"14px 28px",borderRadius:10,background:i===0?"var(--gold-light)":"rgba(255,255,255,0.08)",border:i===0?"none":"1px solid rgba(255,255,255,0.15)",color:i===0?"var(--navy)":"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s"}}>
                {label} →
              </button>
            ))}
          </div>
          <div style={{padding:"16px 20px",background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>
            Need help? Every screen has a guide. Reach out via Messages anytime — we read every note.
          </div>
        </div>
      ),
    },
  ];

  const vendorSteps = [
    {
      icon:"",
      title:"Welcome to KingdomBid",
      sub:"The marketplace where faith-aligned professionals find ministry clients.",
      content:(
        <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:32}}>
          {[
            {num:"01",title:"Browse open projects",body:"Churches post projects with budgets and timelines. Filter by category and find your niche."},
            {num:"02",title:"Submit bids",body:"Write a personal cover letter. Faith-aligned pitches win. Generic ones don't."},
            {num:"03",title:"Build your reputation",body:"Reviews, badges, and your Faith Verified status make your profile stand out."},
          ].map((c,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"16px 18px",background:"rgba(255,255,255,0.06)",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontFamily:"DM Mono,monospace",fontSize:10,color:"rgba(255,255,255,0.25)",paddingTop:3,flexShrink:0,letterSpacing:1}}>{c.num}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"white",marginBottom:4}}>{c.title}</div><div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.6}}>{c.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Get Faith Verified",
      sub:"Verified vendors win significantly more projects. It's your most important trust signal.",
      content:(
        <div style={{marginTop:28}}>
          <div style={{background:"rgba(232,224,208,0.08)",border:"1px solid rgba(232,224,208,0.18)",borderRadius:14,padding:"20px 22px",marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--gold-light)",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Faith Verified badge unlocks</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {["Placement above unverified vendors in search","Churches can filter to Verified Only — you become visible","Higher bid acceptance rates across every category","Trust signal that no general freelance platform can offer"].map((f,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:13,color:"rgba(255,255,255,0.65)"}}>
                  <span style={{color:"var(--gold-light)",flexShrink:0}}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>{markComplete();nav("verify-profile");}} style={{width:"100%",padding:"14px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
            Apply for Faith Verification →
          </button>
          <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Takes about 5 minutes · Reviewed within 48 hours</div>
        </div>
      ),
    },
    {
      icon:"",
      title:"How winning bids work",
      sub:"Churches choose vendors based on these three things.",
      content:(
        <div style={{marginTop:28}}>
          {[
            {rank:"#1",label:"Personalization",body:"Reference specific details from the project. \"Your youth wing renovation on Phase 2...\" wins over \"I can do this job.\""},
            {rank:"#2",label:"Faith alignment",body:"Show how your values match theirs. Mention your church, your faith, why ministry work matters to you."},
            {rank:"#3",label:"Social proof",body:"Reviews, completed projects, and badges. The more you build up, the more bids you win."},
          ].map((t,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"44px 1fr",gap:12,padding:"16px 16px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",marginBottom:10}}>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:22,fontWeight:700,color:"var(--gold-light)",lineHeight:1}}>{t.rank}</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"white",marginBottom:3}}>{t.label}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>{t.body}</div></div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon:"",
      title:"Ready to find ministry clients?",
      sub:"Your profile is live. Start browsing projects now.",
      content:(
        <div style={{marginTop:32,textAlign:"center"}}>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:32}}>
            {[["Browse Projects","projects"],["Complete My Profile","profile"]].map(([label,screen],i)=>(
              <button key={i} onClick={()=>{markComplete();nav(screen);}} style={{padding:"14px 28px",borderRadius:10,background:i===0?"var(--gold-light)":"rgba(255,255,255,0.08)",border:i===0?"none":"1px solid rgba(255,255,255,0.15)",color:i===0?"var(--navy)":"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s"}}>
                {label} →
              </button>
            ))}
          </div>
          <div style={{padding:"16px 20px",background:"rgba(255,255,255,0.04)",borderRadius:12,border:"1px solid rgba(255,255,255,0.07)",fontSize:12,color:"rgba(255,255,255,0.35)",lineHeight:1.7}}>
            Free vendors get 10 bids/month. Upgrade to Pro for unlimited bids + Faith Verified badge included.
          </div>
        </div>
      ),
    },
  ];

  const steps = role === "vendor" ? vendorSteps : churchSteps;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const markComplete = async () => {
    if (currentUser) {
      await supabase.from("profiles").update({onboarding_complete:true}).eq("id",currentUser.id).catch(()=>{});
    }
  };

  const goNext = () => {
    if (isLast) { markComplete(); nav("projects"); return; }
    setStep(s => s + 1);
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--navy)",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Background glow */}
      <div style={{position:"absolute",top:"-20%",left:"50%",transform:"translateX(-50%)",width:900,height:700,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(245,240,232,0.06) 0%,transparent 65%)",pointerEvents:"none"}}/>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 40px",flexShrink:0,position:"relative",zIndex:2}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <CrossLogo size={36}/>
          <span style={{fontFamily:"'Palatino Linotype',Palatino,'Book Antiqua',serif",fontSize:16,fontWeight:600,color:"white",letterSpacing:"0.3px"}}>Kingdom<span style={{color:"var(--gold-light)"}}>Bid</span></span>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{height:3,width:i===step?32:i<step?24:16,borderRadius:2,background:i<step?"var(--gold-light)":i===step?"rgba(245,240,232,0.7)":"rgba(255,255,255,0.1)",transition:"all 0.4s ease"}}/>
          ))}
        </div>
        <button onClick={()=>{markComplete();nav("projects");}} style={{background:"none",border:"none",fontSize:12,color:"rgba(255,255,255,0.25)",cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Skip →</button>
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 24px 48px",position:"relative",zIndex:2}}>
        <div style={{width:"100%",maxWidth:500,animation:"fadeUp 0.45s ease"}}>
          {/* Step icon */}
          <div style={{width:48,height:3,background:"rgba(245,240,232,0.3)",borderRadius:2,margin:"0 auto 20px"}}></div>

          {/* Heading */}
          <div style={{fontFamily:"Playfair Display,serif",fontSize:36,fontWeight:700,color:"white",lineHeight:1.1,letterSpacing:-0.5,marginBottom:10,textAlign:"center"}}>{current.title}</div>
          <div style={{fontSize:15,color:"rgba(255,255,255,0.45)",fontWeight:300,textAlign:"center",lineHeight:1.6,marginBottom:8}}>{current.sub}</div>

          {/* Step content */}
          {current.content}

          {/* Navigation */}
          {!isLast && (
            <div style={{marginTop:32,display:"flex",gap:10,alignItems:"center"}}>
              {step > 0 && (
                <button onClick={()=>setStep(s=>s-1)} style={{padding:"12px 20px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back</button>
              )}
              <button onClick={goNext} style={{flex:1,padding:"14px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"DM Sans,sans-serif",transition:"all 0.2s"}}>
                {step === steps.length - 2 ? "See what's next →" : "Continue"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   RESET PASSWORD SCREEN
   Handles the Supabase password reset redirect
══════════════════════════════════ */
function ResetPasswordScreen({nav, showToast}){
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    showToast("✓ Password updated successfully");
    // Clear hash and redirect after 2s
    window.history.replaceState(null, "", window.location.pathname);
    setTimeout(() => nav("auth"), 2000);
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:420,animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <CrossLogo size={48}/>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:32,fontWeight:700,color:"white",marginTop:16,marginBottom:8}}>
            {done ? "Password updated." : "Set a new password."}
          </div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}>
            {done ? "Redirecting you to sign in…" : "Choose a strong password for your account."}
          </div>
        </div>

        {!done && (
          <>
            {error && <div style={{padding:"12px 16px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:9,fontSize:13,color:"#FCA5A5",marginBottom:20}}>Error: {error}</div>}
            <div style={{position:"relative",marginBottom:28}}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",display:"block",marginBottom:8}}>New Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" style={{width:"100%",padding:"14px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,fontSize:15,color:"white",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{position:"relative",marginBottom:28}}>
              <label style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.3)",display:"block",marginBottom:8}}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat new password" style={{width:"100%",padding:"14px 16px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,fontSize:15,color:"white",fontFamily:"DM Sans,sans-serif",outline:"none",boxSizing:"border-box"}}
                onKeyDown={e=>e.key==="Enter"&&handleReset()}/>
            </div>
            <button onClick={handleReset} disabled={loading||!password||!confirm} style={{width:"100%",padding:"16px",background:"var(--gold-light)",color:"var(--navy)",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",opacity:loading||!password||!confirm?0.6:1,transition:"all 0.2s"}}>
              {loading ? "Updating…" : "Update Password →"}
            </button>
            <div style={{textAlign:"center",marginTop:16}}>
              <button onClick={()=>nav("auth")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back to Sign In</button>
            </div>
          </>
        )}

        {done && (
          <div style={{textAlign:"center",padding:"32px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:14}}>
            <div style={{fontSize:36,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg></div>
            <div style={{fontSize:15,fontWeight:600,color:"white",marginBottom:6}}>All set!</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Taking you back to sign in…</div>
          </div>
        )}
      </div>
    </div>
  );
}