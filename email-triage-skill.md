---
name: email-triage
description: Classify, prioritize, and draft responses for incoming emails. Triggers when the agent needs to process email batches, run triage cycles, or produce email briefings.
---

# Email Triage

Process incoming emails using priority classification and generate actionable outputs.

## ⚡ Token-Efficient Workflow (Chunking)

> **CRITICAL**: Always use the two-step approach below. NEVER fetch full email bodies in bulk.

### Step 1: Fetch Snippets

Use `gog gmail search` to get lightweight snippets first. **Always specify the target account using the `--account` flag:**

```bash
gog gmail search "is:unread" --account johnfabriciusiii@gmail.com --max 20
```

This returns **only** the message ID, sender, subject, and a short snippet for each email — NOT the full body. Use these snippets to classify priority.

### Step 2: Fetch Full Body (P1/P2 Only)

For emails classified as P1 or P2 based on the snippet, fetch the full content. **Again, always specify the account:**

```bash
gog gmail get <messageId> --account <email>
```

**Do NOT fetch full bodies for P3 or P4 emails.** The snippet is sufficient for archiving or auto-responding.

## Priority Classification

1. **Classify** each snippet as P1–P4 based on sender, subject, and snippet content
2. **Fetch full body** only for P1 and P2 items
3. **Triage** each email:
   - P1: Draft alert message for Johnny with summary, recommended action, and deadline
   - P2: Draft full response, queue for Johnny's approval before sending
   - P3: Draft response from snippet alone, add to batch review queue
   - P4: Auto-respond with appropriate template or archive (no full fetch needed)
4. **Brief** — Produce a triage summary with counts by priority, pending items, and follow-ups

## Priority Signals

| Signal | Priority |
|--------|----------|
| Sender domain `@azleg.gov` | P1 |
| Subject contains "litigation", "deadline", "court" | P1 |
| Sender matches known funder contacts | P1–P2 |
| Subject contains "grant", "donation", "pledge" | P2 |
| Subject contains "media", "press", "interview" | P2 (route to comms) |
| Unknown sender, general inquiry | P3 |
| Newsletter, promotional, automated | P4 |

## Output Format

## Email Triage — [DATE]

### P1 URGENT (X items)
- **[Sender]** — [Subject] — [1-line summary] — Action: [recommendation]

### P2 HIGH (X items)
- **[Sender]** — [Subject] — Draft ready for review

### P3 STANDARD (X items)
- [count] responses drafted for batch review

### P4 LOW (X items)
- [count] auto-responded, [count] archived

## Gmail Commands Reference

> **IMPORTANT**: You must append `--account <email>` to **every** gog command so the system knows which inbox to read from or write to. Currently authenticated account: `johnfabriciusiii@gmail.com`. If the user asks to check a different email, try using that email in the `--account` flag.

```bash
# Search (returns snippets only)
gog gmail search "is:unread" --account <email>
gog gmail search "from:arnoldventures.org" --account <email>
gog gmail search "subject:SB 1507" --max 20 --account <email>

# Get full message
gog gmail get <messageId> --account <email>

# Send email
gog gmail send "recipient@example.com" "Subject" "Body" --account <email>

# Create draft
gog gmail draft "recipient@example.com" "Subject" "Body" --account <email>

# Modify labels
gog gmail modify <messageId> --add STARRED --remove UNREAD --account <email>

# List labels
gog gmail labels --account <email>
```

## Routing Rules
- Media/press → sessions_send to comms
- Donations/grants → sessions_send to dev-grants
- Invoices/financial → sessions_send to finance
