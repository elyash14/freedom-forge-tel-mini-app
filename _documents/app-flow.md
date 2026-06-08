# App Flow & User Journey: Financial Freedom Calculator

## Overview
This document outlines the step-by-step user interface and experience flow. The app focuses on guiding users through an inflation-adjusted financial projection, culminating in an interactive dashboard and a detailed projection table.

## Step 1: Define the Goal (Expense Input)
* **UI:** A clean input field asking: *"How much do you need per month for a comfortable life today?"*
* **Action:** User enters their desired monthly expense (E_monthly) in local currency (e.g., Tomans).
* **Note to User:** A tooltip explains: *"Enter today's cost. Don't worry about inflation; our algorithm handles that."*

## Step 2: Current Status (Initial Capital)
* **UI:** Input field: *"How much savings/capital do you currently have to start with?"*
* **Action:** User enters their initial principal (P_0). Can be zero.

## Step 3: Portfolio Construction (Asset Allocation)
* **UI:** A set of sliders or percentage inputs totaling 100%. Categories include: Stock Market, Gold, Crypto, Bank Deposits.
* **Action:** As the user adjusts the sliders, the app fetches the historical data for these assets and calculates the **Average Real Return (R_real)** dynamically.
* **Visual Feedback:** Display the calculated R_real instantly (e.g., *"Your selected portfolio has a historical real return of 5.2% above inflation"*). Warn the user if R_real is negative (e.g., 100% Bank Deposits).

## Step 4: The Interactive Dashboard (Sliders & Results)
* **UI:** 1. A primary output showing: *"You need X Tomans (in today's money) to reach financial freedom."* (C_target).
    2. An interactive slider for **Monthly Contribution (PMT)**.
* **Action:** As the user moves the PMT slider, the app instantly recalculates and updates a large metric showing: *"You will reach financial freedom in **Y Years**."* (n).
* **Crucial Disclaimer Alert:** A permanent, highly visible note on this page: *"⚠️ **Important:** To achieve this timeline, you MUST increase your monthly contribution every year to match the annual inflation rate."*

## Step 5: The Yearly Projection Table (Real Terms)
* **UI:** A detailed breakdown table showing the path to financial freedom year by year.
* **Data Mapping:** Everything in this table is presented in **Today's Purchasing Power** to keep the numbers comprehensible.

| Year | Starting Capital | Annual Contribution | Return Earned | Ending Capital |
| :--- | :--- | :--- | :--- | :--- |
| 1 | P_0 | PMT * 12 | (P_0 + PMT * 12) * R_real | End of Year 1 Balance |
| 2 | Prev Year End | PMT * 12 | (Start + Contrib) * R_real | End of Year 2 Balance |
| ... | ... | ... | ... | ... |
| Target | ... | ... | ... | **Goal Reached (C_target)** |

* **Logic Note for Cursor:** The `Annual Contribution` column remains statically displaying the `PMT * 12` value because the table represents "Today's Value". The backend does not need to multiply by arbitrary inflation metrics for this display.