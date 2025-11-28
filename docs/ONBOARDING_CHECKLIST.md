# Onboarding Wizard & Mock Data: Implementation Checklist

## Operational Checklist

1. **Requirements Definition**

   - What steps should the onboarding wizard include?
   - What mock data is needed (categories, transactions, etc.)?
   - When and how should the app transition from mock to real data?

2. **First Access Detection**

   - Use a flag in localStorage/sessionStorage/backend.
   - Consider cross-device synchronization if multi-device support is required.

3. **Mock Data Creation**

   - Store mock data in a separate file (e.g., `src/seed/mockData.ts`).
   - Ensure the structure matches real data models.

4. **Wizard Integration**

   - Use lazy loading for the wizard component.
   - Design clear, mobile-friendly steps.
   - Allow users to skip or repeat the wizard.

5. **Mock Data Population**

   - Automatically load mock data on first access.
   - Isolate mock data from real user data.

6. **Transition to Real Data**

   - Clean up mock data when the user starts using the app for real.
   - Ask for explicit user confirmation before switching.

7. **State Persistence**

   - Save onboarding completion status.
   - Handle refreshes, logouts, and multiple logins.

8. **Testing**
   - Test on various devices and browsers.
   - Cover corner cases (see below).

---

## Senior Developer Questions

- How is onboarding state synchronized across devices?
- Can mock data interfere with real data? How is separation ensured?
- What happens if the user reloads the page during onboarding?
- How are errors in loading or saving mock data handled?
- Is the wizard accessible (a11y)? Does it work with screen readers?
- How do we handle users who skip or want to repeat the wizard?
- What if the user clears cache/localStorage?
- Is the transition from mock to real data clear and safe?
- How do we handle onboarding rollback or reset?

---

## Corner Cases to Consider

- User logs in on multiple devices at the same time.
- User closes the wizard midway and returns later.
- Mock data remains after switching to real data.
- Frontend/backend synchronization errors.
- Wizard not shown due to flag error.
- User clears localStorage and ends up with mixed mock/real data.
- Offline access: does onboarding and mock data work without connection?
- Future updates: how to handle changes in mock data structure?

---

Feel free to expand this checklist as the project evolves.
