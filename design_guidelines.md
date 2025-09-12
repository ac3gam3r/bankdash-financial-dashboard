# Financial Dashboard Design Guidelines

## Design Approach
**Design System Approach** using Material Design principles for a data-heavy, trust-focused financial application. This ensures consistency, accessibility, and familiarity for users managing sensitive financial information.

## Core Design Principles
- **Trust & Security**: Professional appearance that instills confidence
- **Data Clarity**: Clear hierarchy for financial information
- **Mobile-First**: Optimized for mobile banking habits
- **Accessibility**: High contrast and readable typography

## Color Palette

### Light Mode
- **Primary**: 220 85% 25% (Deep professional blue)
- **Secondary**: 220 25% 95% (Light blue-gray backgrounds)
- **Success**: 140 65% 35% (Transaction credits/positive amounts)
- **Warning**: 25 85% 50% (Alerts and pending transactions)
- **Error**: 0 75% 45% (Debits/negative amounts)
- **Background**: 0 0% 98% (Primary background)
- **Surface**: 0 0% 100% (Card backgrounds)

### Dark Mode
- **Primary**: 220 80% 70% (Lighter blue for contrast)
- **Secondary**: 220 15% 15% (Dark backgrounds)
- **Success**: 140 55% 55% (Adjusted for dark mode)
- **Warning**: 25 75% 60% (Adjusted for dark mode)
- **Error**: 0 65% 60% (Adjusted for dark mode)
- **Background**: 220 15% 8% (Primary dark background)
- **Surface**: 220 10% 12% (Card backgrounds)

## Typography
- **Primary Font**: Inter via Google Fonts CDN
- **Headings**: 600-700 weight for account balances and section titles
- **Body Text**: 400-500 weight for transaction details
- **Numbers**: Tabular figures for consistent financial data alignment

## Layout System
**Tailwind Spacing Units**: Consistently use 2, 4, 6, 8, 12, 16 for predictable spacing
- **Mobile**: Single column with 4-unit padding
- **Tablet/Desktop**: Two-column layout for accounts and transactions

## Component Library

### Navigation
- **Top Bar**: Account selector, total balance, user menu
- **Bottom Tab Bar** (Mobile): Dashboard, Transactions, Categories, Settings

### Data Display
- **Balance Cards**: Large, prominent display with subtle shadows
- **Transaction Lists**: Clean rows with clear visual separation
- **Category Tags**: Rounded pills with category-specific colors

### Forms
- **Account Connection**: Multi-step modal with progress indicators
- **Category Management**: Drag-and-drop interface for organization
- **Filters**: Collapsible panels with date ranges and category selection

### Interactive Elements
- **Account Cards**: Tappable with subtle hover states
- **Transaction Items**: Expandable for additional details
- **Quick Actions**: Floating action button for adding manual transactions

## Key Features
- **Balance Hierarchy**: Largest text for total balance, secondary for individual accounts
- **Transaction Categorization**: Color-coded categories with consistent iconography
- **Progressive Disclosure**: Summary view with drill-down capabilities
- **Status Indicators**: Clear pending/completed transaction states

## Accessibility
- **High Contrast**: All financial amounts use strong color contrast
- **Screen Reader**: Proper ARIA labels for financial data
- **Touch Targets**: Minimum 44px for mobile interactions
- **Font Scaling**: Responsive typography that scales appropriately

## Icon Strategy
Use Heroicons via CDN for consistent, professional iconography focused on:
- Banking and financial symbols
- Category representations (shopping, dining, transportation)
- Navigation and action indicators

This design creates a trustworthy, professional financial dashboard that prioritizes data clarity and user confidence while maintaining modern design standards.