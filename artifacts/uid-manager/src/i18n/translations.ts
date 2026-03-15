export type Language = 'en' | 'bn'

export type TranslationKey =
  // Header
  | 'appTitle'
  | 'appSubtitle'
  // Input section
  | 'inputLabel'
  | 'inputPlaceholder'
  | 'processBtn'
  | 'clearBtn'
  | 'dragDropHint'
  | 'lineCount'
  // Filter tabs
  | 'tabAll'
  | 'tabUnchecked'
  | 'tabChecked'
  | 'tabSaved'
  // Stats
  | 'totalUIDs'
  | 'unlocked'
  | 'private'
  | 'unfetched'
  | 'totalFriends'
  // Bulk actions
  | 'selectAll'
  | 'deselectAll'
  | 'saveSelected'
  | 'copySelected'
  | 'removeSelected'
  | 'checkAll'
  | 'uncheckAll'
  // Per-entry actions
  | 'save'
  | 'remove'
  | 'copy'
  | 'copyUID'
  | 'copyPass'
  | 'copyBoth'
  | 'copyName'
  | 'addNote'
  | 'showPass'
  | 'hidePass'
  // Token/Cookie section
  | 'tokenLabel'
  | 'cookieLabel'
  | 'tokenPlaceholder'
  | 'cookiePlaceholder'
  | 'tokenSection'
  | 'fetchAll'
  | 'fetchUnfetched'
  // Lock status badges
  | 'statusUnlocked'
  | 'statusPrivate'
  | 'statusNotFound'
  | 'statusInvalidToken'
  | 'statusUnknown'
  // Export/Tools section
  | 'exportSection'
  | 'exportTxt'
  | 'exportCsv'
  | 'exportAll'
  | 'exportChecked'
  | 'exportUnchecked'
  | 'exportSaved'
  // Sort options
  | 'sortBy'
  | 'sortMostFriends'
  | 'sortLeastFriends'
  | 'sortUnlockedFirst'
  | 'sortLockedFirst'
  // Copy bulk
  | 'copyNames'
  | 'copyUnlocked'
  | 'copyPrivate'
  // Toast messages
  | 'toastProcessed'
  | 'toastCopied'
  | 'toastSaved'
  | 'toastRemoved'
  | 'toastCleared'
  | 'toastClearConfirm'
  | 'toastFetchStarted'
  | 'toastFetchDone'
  | 'toastNoToken'
  // Theme / Language
  | 'lightTheme'
  | 'darkTheme'
  | 'languageToggle'
  // Empty state
  | 'emptyState'
  | 'noResults'
  // Progress
  | 'fetching'
  | 'success'
  | 'failed'

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    // Header
    appTitle: 'FB UID Manager Pro v2',
    appSubtitle: 'Facebook UID Management Tool',
    // Input section
    inputLabel: 'Paste UID|PASS data',
    inputPlaceholder: 'Paste UID|PASS lines here, one per line…\nExample: 123456789|mypassword',
    processBtn: 'Process',
    clearBtn: 'Clear',
    dragDropHint: 'Drag & drop up to 20 .txt files',
    lineCount: 'Lines',
    // Filter tabs
    tabAll: 'All',
    tabUnchecked: 'Unchecked',
    tabChecked: 'Checked',
    tabSaved: 'Saved',
    // Stats
    totalUIDs: 'Total UIDs',
    unlocked: 'Unlocked',
    private: 'Private',
    unfetched: 'Unfetched',
    totalFriends: 'Total Friends',
    // Bulk actions
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    saveSelected: 'Save Selected',
    copySelected: 'Copy Selected',
    removeSelected: 'Remove Selected',
    checkAll: 'Check All',
    uncheckAll: 'Uncheck All',
    // Per-entry actions
    save: 'Save',
    remove: 'Remove',
    copy: 'Copy',
    copyUID: 'Copy UID',
    copyPass: 'Copy Pass',
    copyBoth: 'Copy Both',
    copyName: 'Copy Name',
    addNote: 'Add Note',
    showPass: 'Show',
    hidePass: 'Hide',
    // Token/Cookie section
    tokenLabel: 'Access Token',
    cookieLabel: 'Cookie',
    tokenPlaceholder: 'Enter Facebook access token…',
    cookiePlaceholder: 'Enter Facebook cookie (optional)…',
    tokenSection: 'Token & Cookie',
    fetchAll: 'Fetch All',
    fetchUnfetched: 'Fetch Unfetched',
    // Lock status badges
    statusUnlocked: 'Unlocked',
    statusPrivate: 'Private',
    statusNotFound: 'Not Found',
    statusInvalidToken: 'Invalid Token',
    statusUnknown: 'Unknown',
    // Export/Tools section
    exportSection: 'Tools & Export',
    exportTxt: 'Export .txt',
    exportCsv: 'Export .csv',
    exportAll: 'All',
    exportChecked: 'Checked',
    exportUnchecked: 'Unchecked',
    exportSaved: 'Saved',
    // Sort options
    sortBy: 'Sort by',
    sortMostFriends: 'Most Friends',
    sortLeastFriends: 'Least Friends',
    sortUnlockedFirst: 'Unlocked First',
    sortLockedFirst: 'Locked First',
    // Copy bulk
    copyNames: 'Copy Names',
    copyUnlocked: 'Copy Unlocked',
    copyPrivate: 'Copy Private',
    // Toast messages
    toastProcessed: 'UIDs processed successfully',
    toastCopied: 'Copied to clipboard',
    toastSaved: 'Saved',
    toastRemoved: 'Removed',
    toastCleared: 'List cleared',
    toastClearConfirm: 'Tap again to clear all',
    toastFetchStarted: 'Fetching started…',
    toastFetchDone: 'Fetch complete',
    toastNoToken: 'Please enter an access token',
    // Theme / Language
    lightTheme: 'Light',
    darkTheme: 'Dark',
    languageToggle: 'বাংলা',
    // Empty state
    emptyState: 'No UIDs yet. Paste some data above.',
    noResults: 'No results for this filter.',
    // Progress
    fetching: 'Fetching',
    success: 'Success',
    failed: 'Failed',
  },
  bn: {
    // Header
    appTitle: 'FB UID ম্যানেজার প্রো v2',
    appSubtitle: 'ফেসবুক UID ম্যানেজমেন্ট টুল',
    // Input section
    inputLabel: 'UID|PASS ডেটা পেস্ট করুন',
    inputPlaceholder: 'এখানে UID|PASS লাইন পেস্ট করুন, প্রতিটি লাইনে একটি করে…\nউদাহরণ: 123456789|mypassword',
    processBtn: 'প্রসেস করুন',
    clearBtn: 'মুছুন',
    dragDropHint: 'সর্বোচ্চ ২০টি .txt ফাইল ড্র্যাগ ও ড্রপ করুন',
    lineCount: 'লাইন',
    // Filter tabs
    tabAll: 'সব',
    tabUnchecked: 'আনচেক',
    tabChecked: 'চেক করা',
    tabSaved: 'সেভ করা',
    // Stats
    totalUIDs: 'মোট UID',
    unlocked: 'আনলক',
    private: 'প্রাইভেট',
    unfetched: 'আনফেচড',
    totalFriends: 'মোট বন্ধু',
    // Bulk actions
    selectAll: 'সব নির্বাচন করুন',
    deselectAll: 'নির্বাচন বাতিল করুন',
    saveSelected: 'নির্বাচিত সেভ করুন',
    copySelected: 'নির্বাচিত কপি করুন',
    removeSelected: 'নির্বাচিত সরান',
    checkAll: 'সব চেক করুন',
    uncheckAll: 'সব আনচেক করুন',
    // Per-entry actions
    save: 'সেভ',
    remove: 'সরান',
    copy: 'কপি',
    copyUID: 'UID কপি',
    copyPass: 'পাসওয়ার্ড কপি',
    copyBoth: 'উভয় কপি',
    copyName: 'নাম কপি',
    addNote: 'নোট যোগ করুন',
    showPass: 'দেখুন',
    hidePass: 'লুকান',
    // Token/Cookie section
    tokenLabel: 'অ্যাক্সেস টোকেন',
    cookieLabel: 'কুকি',
    tokenPlaceholder: 'ফেসবুক অ্যাক্সেস টোকেন দিন…',
    cookiePlaceholder: 'ফেসবুক কুকি দিন (ঐচ্ছিক)…',
    tokenSection: 'টোকেন ও কুকি',
    fetchAll: 'সব ফেচ করুন',
    fetchUnfetched: 'আনফেচড ফেচ করুন',
    // Lock status badges
    statusUnlocked: 'আনলক',
    statusPrivate: 'প্রাইভেট',
    statusNotFound: 'খুঁজে পাওয়া যায়নি',
    statusInvalidToken: 'অবৈধ টোকেন',
    statusUnknown: 'অজানা',
    // Export/Tools section
    exportSection: 'টুলস ও এক্সপোর্ট',
    exportTxt: '.txt এক্সপোর্ট',
    exportCsv: '.csv এক্সপোর্ট',
    exportAll: 'সব',
    exportChecked: 'চেক করা',
    exportUnchecked: 'আনচেক',
    exportSaved: 'সেভ করা',
    // Sort options
    sortBy: 'সাজান',
    sortMostFriends: 'সবচেয়ে বেশি বন্ধু',
    sortLeastFriends: 'সবচেয়ে কম বন্ধু',
    sortUnlockedFirst: 'আনলক আগে',
    sortLockedFirst: 'লক আগে',
    // Copy bulk
    copyNames: 'নাম কপি করুন',
    copyUnlocked: 'আনলক কপি করুন',
    copyPrivate: 'প্রাইভেট কপি করুন',
    // Toast messages
    toastProcessed: 'UID সফলভাবে প্রসেস হয়েছে',
    toastCopied: 'ক্লিপবোর্ডে কপি হয়েছে',
    toastSaved: 'সেভ হয়েছে',
    toastRemoved: 'সরানো হয়েছে',
    toastCleared: 'তালিকা মুছে গেছে',
    toastClearConfirm: 'সব মুছতে আবার ট্যাপ করুন',
    toastFetchStarted: 'ফেচিং শুরু হয়েছে…',
    toastFetchDone: 'ফেচ সম্পন্ন',
    toastNoToken: 'অনুগ্রহ করে একটি অ্যাক্সেস টোকেন দিন',
    // Theme / Language
    lightTheme: 'লাইট',
    darkTheme: 'ডার্ক',
    languageToggle: 'English',
    // Empty state
    emptyState: 'এখনো কোনো UID নেই। উপরে কিছু ডেটা পেস্ট করুন।',
    noResults: 'এই ফিল্টারে কোনো ফলাফল নেই।',
    // Progress
    fetching: 'ফেচ হচ্ছে',
    success: 'সফল',
    failed: 'ব্যর্থ',
  },
}
