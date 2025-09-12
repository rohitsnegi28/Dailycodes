# 🛡️ Content Security Policy Implementation Guide

**Complete Web Application Security Enhancement Documentation**

---

## 📋 Table of Contents

- [Executive Summary](#executive-summary)
- [Current Security Analysis](#current-security-analysis)
- [Risk & Impact Analysis](#risk--impact-analysis)
- [Browser Console Testing](#browser-console-testing)
- [Implementation Guide](#implementation-guide)
- [Code Changes Required](#code-changes-required)
- [Testing Strategy](#testing-strategy)
- [Deployment Timeline](#deployment-timeline)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Emergency Procedures](#emergency-procedures)
- [Implementation Checklist](#implementation-checklist)

---

## 🎯 Executive Summary

This document provides a comprehensive implementation guide for Content Security Policy (CSP) security enhancements for `fasatexternal.manulife.com`. The analysis, based on the provided security scan results, identifies critical security vulnerabilities and provides step-by-step remediation instructions.

### Key Findings

- **Current Status**: At least 5 critical CSP security tests are failing
- **Risk Level**: **HIGH** (due to vulnerabilities allowing inline styles and insecure connections)
- **Implementation Time**: Estimated at 2-3 weeks
- **Business Impact**: Implementing these changes will significantly enhance the application's security posture, protect against common web attacks, and help maintain regulatory compliance

### Critical Issues Requiring Immediate Attention

- **Inline Style Vulnerabilities** (`style-src 'unsafe-inline'`) - High risk of Cross-Site Scripting (XSS) attacks
- **Missing Clickjacking Protection** (`frame-ancestors`) - The application can be embedded in malicious sites
- **Missing Form & Base URI Protection** - Vulnerable to data exfiltration and base tag hijacking

---

## 🚨 Current Security Analysis

### Failed Security Tests

| Test Description | Current Status | Risk Level | Impact |
|---|---|---|---|
| Inline Style Protection | ❌ FAIL | HIGH | The policy allows `'unsafe-inline'`, a known XSS vector |
| Clickjacking Protection | ❌ FAIL | MEDIUM | Missing `frame-ancestors` directive |
| Form Action Security | ❌ FAIL | MEDIUM | Missing `form-action` directive to restrict form submissions |
| Base Tag Restrictions | ❌ FAIL | MEDIUM | Missing `base-uri` directive to prevent hijacking |
| Mixed Content Prevention | ❌ FAIL | HIGH | The `connect-src` directive permits insecure `http:` connections |

### Current CSP Configuration

*This configuration was taken from your provided code screenshot.*

```csharp
headers["Content-Security-Policy"] = 
    $"default-src 'self' {FasetApiConstants.httpsSourcesForIoDomain};" +
    $"script-src 'self' 'unsafe-hashes' {FasetApiConstants.scriptHash} {FasetApiConstants.externalScript};" +
    $"style-src 'self' 'unsafe-inline';" + // ❌ SECURITY VULNERABILITY
    $"font-src 'self';" +
    $"object-src 'self'; frame-src 'self' blob:;" +
    $"media-src 'self';" +
    $"style-src-attr 'unsafe-hashes' 'unsafe-inline';" +
    $"img-src data: https: 'self';" +
    $"connect-src 'self' http: ws: wss:;"; // ❌ ALLOWS INSECURE HTTP
```

---

## 📊 Risk & Impact Analysis

### Directive-by-Directive Assessment

| CSP Directive | Purpose | Implementation Risk | Verification Method | Status |
|---|---|---|---|---|
| `style-src 'self'` | Remove `'unsafe-inline'` | 🔴 HIGH - Breaks all inline styles | Search code for `style=""` attributes | ❌ VULNERABLE |
| `connect-src https: wss:` | Remove insecure HTTP | 🔴 HIGH - API calls to HTTP endpoints will fail | Analyze network requests for HTTP calls | ❌ INSECURE |
| `base-uri 'self'` | Missing directive | ✅ LOW - Safe to implement; low chance of impact | Search code for `<base>` tags | ❌ MISSING |
| `form-action 'self'` | Missing directive | 🟡 MEDIUM - Forms submitting to external sites will break | Search code for external form actions | ❌ MISSING |
| `frame-ancestors 'self'` | Missing directive | ✅ LOW - Protects against Clickjacking | Check for legitimate iframe embedding needs | ❌ MISSING |
| `upgrade-insecure-requests` | Missing directive | 🟡 MEDIUM - Forces HTTPS, requires server support | Verify all endpoints support HTTPS | ❌ MISSING |

---

## 🧪 Browser Console Testing

### Complete Security Assessment Script

**Usage Instructions:**
1. Open your web application in a browser
2. Press **F12** to open Developer Tools and navigate to the **Console** tab
3. Paste the entire script below and press **Enter**
4. Review the color-coded results and action plan directly in your console

```javascript
// =====================================================
// CSP SECURITY IMPACT ANALYZER
// =====================================================

console.log('🛡️ Starting Comprehensive CSP Security Analysis...\n');

const securityAnalysis = {
    criticalIssues: [],
    warnings: [],
    recommendations: [],
    statistics: {}
};

// 1. INLINE STYLE VULNERABILITY SCAN
console.log('🔍 Scanning for Inline Style Vulnerabilities...');
const inlineStyleElements = document.querySelectorAll('[style]');
securityAnalysis.statistics.inlineStyles = inlineStyleElements.length;

if (inlineStyleElements.length > 0) {
    securityAnalysis.criticalIssues.push(
        `🔴 CRITICAL: ${inlineStyleElements.length} elements with inline styles found. These must be moved to external CSS files.`
    );
    console.log(`   ❌ Found ${inlineStyleElements.length} elements with style="" attributes that will break with a secure CSP.`);
    Array.from(inlineStyleElements).slice(0, 3).forEach((element, index) => {
        console.log(`   Example ${index + 1}: <${element.tagName.toLowerCase()}> with style="${element.getAttribute('style')}"`);
    });
} else {
    securityAnalysis.recommendations.push('✅ No inline style vulnerabilities detected');
}

// 2. MIXED CONTENT SECURITY SCAN
console.log('\n🔍 Scanning for Mixed Content Vulnerabilities...');
const httpResources = [];
document.querySelectorAll('img, script, link[href], iframe[src], object[data]').forEach(el => {
    const resourceUrl = el.src || el.href || el.data;
    if (resourceUrl && resourceUrl.startsWith('http:')) {
        httpResources.push({ type: el.tagName.toLowerCase(), url: resourceUrl });
    }
});

securityAnalysis.statistics.httpResources = httpResources.length;
if (httpResources.length > 0) {
    securityAnalysis.criticalIssues.push(
        `🔴 CRITICAL: ${httpResources.length} insecure HTTP resources detected. These must be converted to HTTPS.`
    );
    console.log(`   ❌ Mixed content vulnerabilities found:`);
    httpResources.forEach(resource => console.log(`   - ${resource.type.toUpperCase()}: ${resource.url}`));
} else {
    securityAnalysis.recommendations.push('✅ All resources use secure HTTPS protocol');
}

// 3. FORM SECURITY ANALYSIS
console.log('\n🔍 Analyzing Form Security Configuration...');
const externalFormActions = [];
document.querySelectorAll('form[action]').forEach(form => {
    try {
        const actionUrl = new URL(form.action, window.location.origin);
        if (actionUrl.hostname !== window.location.hostname) {
            externalFormActions.push(actionUrl.href);
        }
    } catch (e) { /* Ignore invalid or relative URLs */ }
});

securityAnalysis.statistics.externalForms = externalFormActions.length;
if (externalFormActions.length > 0) {
    securityAnalysis.warnings.push(
        `🟡 WARNING: ${externalFormActions.length} forms submit to external domains. These must be whitelisted in 'form-action'.`
    );
    console.log('   ⚠️ External form actions requiring whitelist:');
    externalFormActions.forEach(action => console.log(`   - ${action}`));
} else {
    securityAnalysis.recommendations.push('✅ All forms submit to the current domain.');
}

// ===== COMPREHENSIVE SECURITY REPORT =====
console.log('\n' + '='.repeat(60));
console.log('📊 COMPREHENSIVE SECURITY ANALYSIS RESULTS');
console.log('='.repeat(60));

console.log('\n🔴 CRITICAL SECURITY ISSUES:');
if (securityAnalysis.criticalIssues.length === 0) console.log('   ✅ No critical vulnerabilities detected!');
else securityAnalysis.criticalIssues.forEach(issue => console.log(`   ${issue}`));

console.log('\n🟡 SECURITY WARNINGS:');
if (securityAnalysis.warnings.length === 0) console.log('   ✅ No security warnings identified!');
else securityAnalysis.warnings.forEach(warning => console.log(`   ${warning}`));

console.log('\n✅ SECURITY RECOMMENDATIONS:');
if (securityAnalysis.recommendations.length === 0) console.log('   No specific recommendations at this time.');
else securityAnalysis.recommendations.forEach(rec => console.log(`   ${rec}`));

console.log('\n🎯 RECOMMENDED ACTION PLAN:');
console.log("   1. 🔴 IMMEDIATE: Externalize all inline CSS styles and convert HTTP resources to HTTPS.");
console.log("   2. 🟡 HIGH PRIORITY: Audit external form submissions and update CSP 'form-action' if they are legitimate.");
console.log("   3. 📝 IMPLEMENT: Add 'base-uri', 'form-action', and 'frame-ancestors' directives to the CSP.");
console.log("   4. 🧪 TEST: Use the 'Content-Security-Policy-Report-Only' header to test the new policy without breaking the site.");
console.log("   5. 🚀 DEPLOY: Deploy the fully enforced, secure CSP after thorough validation.");

return securityAnalysis;
```

---

## 🛠️ Implementation Guide

### Recommended Secure Configuration

*This is the target state for your CSP. It addresses all identified vulnerabilities.*

```csharp
headers["Content-Security-Policy"] = 
    $"default-src 'self' {FasetApiConstants.httpsSourcesForIoDomain}; " +
    $"script-src 'self' 'unsafe-hashes' {FasetApiConstants.scriptHash} {FasetApiConstants.externalScript}; " +
    $"style-src 'self'; " + // ✅ SECURE - No 'unsafe-inline'
    $"font-src 'self'; " +
    $"object-src 'none'; " + // ✅ SECURE - Disables plugins like Flash
    $"frame-src 'self'; " +
    $"media-src 'self'; " +
    $"img-src 'self' data: https:; " +
    $"connect-src 'self' wss:; " + // ✅ SECURE - HTTPS/WSS only (adjust if specific domains are needed)
    $"base-uri 'self'; " + // ✅ ADDED - Prevents base tag injection
    $"form-action 'self'; " + // ✅ ADDED - Prevents form hijacking
    $"frame-ancestors 'self'; " + // ✅ ADDED - Clickjacking protection
    $"upgrade-insecure-requests; "; // ✅ ADDED - Forces HTTPS
```

---

## 🔧 Code Changes Required

### Phase 1: Update CSP Header & Remediate Code

#### 1.1 Update CSP Header Configuration

**File:** Security Middleware or Global Header Configuration (e.g., `FasetResponseHeaderControlMiddleware.cs`)

```csharp
// REPLACE the existing CSP string with the secure version
headers["Content-Security-Policy"] = 
    $"default-src 'self' {FasetApiConstants.httpsSourcesForIoDomain}; " +
    // ... (copy the full recommended secure configuration from the section above) ...
    $"upgrade-insecure-requests; ";
```

#### 1.2 Inline Style Remediation (Critical)

All inline `style="..."` attributes must be removed and replaced with CSS classes.

**Before (Vulnerable):**
```html
<div style="color: red; font-weight: bold;">Error Message</div>
<button style="background-color: blue; color: white; padding: 10px;">Submit</button>
```

**After (Secure):**
```html
<div class="error-message">Error Message</div>
<button class="btn-primary">Submit</button>

<style>
  .error-message {
    color: red;
    font-weight: bold;
  }
  .btn-primary {
    background-color: blue;
    color: white;
    padding: 10px;
    border: none;
    cursor: pointer;
  }
</style>
```

#### 1.3 HTTP to HTTPS Resource Conversion (Critical)

All hardcoded `http://` URLs for assets, APIs, etc., must be changed to `https://`.

**Before (Insecure):**
```html
<script src="http://some-cdn.com/library.js"></script>
<img src="http://images.example.com/logo.png">
```

**After (Secure):**
```html
<script src="https://some-cdn.com/library.js"></script>
<img src="https://images.example.com/logo.png">
```

---

## 🧪 Testing Strategy

### Phase 1: Safe Testing with Report-Only Mode

Deploy the new policy in a non-blocking mode to gather violation data without affecting users.

```csharp
// Keep your existing, working CSP
headers["Content-Security-Policy"] = "/* your CURRENT, working CSP string */"; 

// Add the new, stricter policy in Report-Only mode for testing
string newStricterCSP = "/* the full RECOMMENDED SECURE configuration */";
headers["Content-Security-Policy-Report-Only"] = newStricterCSP;
```

### Phase 2: Staging Environment Validation

- Deploy the fully enforced secure CSP to your staging environment
- Perform a full regression test of the application
- Pay close attention to styling (for missed inline styles), API calls, and form submissions
- Test across all major browsers (Chrome, Firefox, Safari, Edge)

---

## 📅 Deployment Timeline

### Week 1: Analysis & Quick Wins
- **Day 1-2**: Run console analysis script on all pages; document findings
- **Day 3-4**: Implement low-risk directives (`base-uri`, `form-action`, `frame-ancestors`) in Report-Only mode
- **Day 5**: Deploy Report-Only CSP to staging to start gathering violation data

### Week 2: Critical Vulnerability Remediation
- **Day 1-3**: Focus on the largest task: externalizing all inline CSS styles
- **Day 4**: Convert all identified HTTP resources to HTTPS
- **Day 5**: Test all remediation work in a development environment

### Week 3: Testing & Production Deployment
- **Day 1-2**: Deploy enforced policy to staging; begin comprehensive QA testing
- **Day 3**: User Acceptance Testing (UAT) and stakeholder sign-off
- **Day 4**: Prepare production deployment and rollback plan
- **Day 5**: Deploy to production during a scheduled maintenance window

---

## 📈 Monitoring & Maintenance

- **CSP Reporting Endpoint**: Set up a service like Report URI to centrally collect and analyze CSP violations from real users after deployment
- **Regular Audits**: Re-run the console analysis script quarterly and after major feature releases to catch new issues

---

## 🆘 Emergency Procedures

- **Immediate Rollback**: If the production deployment causes critical failures, immediately revert the code change that introduced the new CSP and redeploy the previous stable version
- **Root Cause Analysis**: Use data from your reporting endpoint or user feedback to identify what was missed
- **Hotfix**: Correct the CSP in a separate branch, test thoroughly in staging, and then schedule a new deployment

---

## ✅ Implementation Checklist

### Phase 1: Analysis & Planning
- [ ] Run console script on all key application pages
- [ ] Document all required code changes (inline styles, HTTP links)
- [ ] Deploy Report-Only policy to staging

### Phase 2: Remediation
- [ ] Externalize all inline styles into CSS files
- [ ] Convert all HTTP resources to HTTPS
- [ ] Verify remediation in a development branch

### Phase 3: Testing & Validation
- [ ] Deploy full (enforced) CSP to staging
- [ ] Conduct full regression and cross-browser testing
- [ ] Obtain UAT sign-off from stakeholders

### Phase 4: Deployment & Post-Launch
- [ ] Schedule production deployment window
- [ ] Document the final rollback procedure
- [ ] Deploy to production
- [ ] Monitor CSP reporting endpoint and application health

---

*This document serves as a comprehensive guide for implementing Content Security Policy enhancements to improve web application security posture and protect against common attack vectors.*