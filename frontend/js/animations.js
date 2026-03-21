/**
 * animations.js — Scroll reveal + navbar + hero mini-stats
 */

// ── Scroll reveal via IntersectionObserver ────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function initScrollReveal() {
    document.querySelectorAll('.fade-section').forEach(el => {
        revealObserver.observe(el);
    });
    // Trigger hero immediately (it's in viewport)
    const hero = document.getElementById('hero-section');
    if (hero) setTimeout(() => hero.classList.add('visible'), 100);
}

// ── Navbar shrink on scroll ───────────────────────────────
function initNavbarScroll() {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;
    window.addEventListener('scroll', () => {
        toolbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
}

// ── Hero mini-stats (populated after dashboard loads) ─────
window.populateHeroStats = function(data) {
    const container = document.getElementById('hero-right');
    if (!container || !data) return;
    const s = data.financial_summary;
    const inc = data.user?.monthly_income || 0;
    const dti = inc > 0 ? ((s.monthly_emi / inc) * 100).toFixed(0) : 0;
    container.innerHTML = [
        { label: 'Net Income',   value: `₹${Math.round(inc).toLocaleString('en-IN')}` },
        { label: 'Total Debts',  value: data.debts?.summary?.total_debts || 0 },
        { label: 'DTI Ratio',    value: `${dti}%` },
        { label: 'Goals Active', value: data.goals?.summary?.total_goals || 0 }
    ].map(item => `
        <div class="hero-stat-item">
            <span class="hero-stat-label">${item.label}</span>
            <span class="hero-stat-value">${item.value}</span>
        </div>
    `).join('<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);">');
};

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initNavbarScroll();
});
