import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Settings, Sliders, Type, HelpCircle,
  Hash, Mail, Phone, Link2, List, CheckSquare, Radio, Calendar, Clock, Upload, Image, 
  Star, ToggleLeft, Save, PlusCircle, CheckCircle, AlertCircle, AlertTriangle, FileText,
  Sparkles, Check
} from 'lucide-react';
import { 
  fetchFormDetails as getFormDetails, fetchFormFields, saveFormObj, createAuditLogObj,
  getNextFormId
} from '../utils/dbHelper';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Preset field templates
const FIELD_TYPES = {
  basic: [
    { type: 'shortText', label: 'Short Text', icon: Type, defaultLabel: 'Untitled Question' },
    { type: 'longText', label: 'Long Text (Textarea)', icon: FileText, defaultLabel: 'Untitled Description' },
    { type: 'email', label: 'Email', icon: Mail, defaultLabel: 'Email Address', placeholder: 'yourname@example.com' },
    { type: 'phone', label: 'Phone Number', icon: Phone, defaultLabel: 'Phone Number', placeholder: '+1 (555) 000-0000' },
    { type: 'number', label: 'Number', icon: Hash, defaultLabel: 'Quantity/Age' },
    { type: 'url', label: 'Website URL', icon: Link2, defaultLabel: 'Website Link', placeholder: 'https://example.com' }
  ],
  selection: [
    { type: 'dropdown', label: 'Dropdown Select', icon: List, defaultLabel: 'Select an Option', options: ['Option 1', 'Option 2'] },
    { type: 'radio', label: 'Radio Buttons', icon: Radio, defaultLabel: 'Choose One Option', options: ['Option 1', 'Option 2'] },
    { type: 'checkbox', label: 'Checkboxes (Multi)', icon: CheckSquare, defaultLabel: 'Select All That Apply', options: ['Option 1', 'Option 2'] },
    { type: 'multiSelect', label: 'Multi-Select Menu', icon: List, defaultLabel: 'Select Multiple Options', options: ['Option A', 'Option B'] }
  ],
  advanced: [
    { type: 'date', label: 'Date Picker', icon: Calendar, defaultLabel: 'Select Date' },
    { type: 'time', label: 'Time Picker', icon: Clock, defaultLabel: 'Select Time' },
    { type: 'fileUpload', label: 'File Upload', icon: Upload, defaultLabel: 'Attach Documents', maxFileSize: 5 }, // MB
    { type: 'imageUpload', label: 'Image Upload', icon: Image, defaultLabel: 'Upload Image', maxFileSize: 5 }, // MB
    { type: 'rating', label: 'Rating Scale', icon: Star, defaultLabel: 'Rate your experience', ratingMax: 5 },
    { type: 'toggle', label: 'Yes/No Toggle', icon: ToggleLeft, defaultLabel: 'Do you agree?', defaultValue: 'no' },
    { type: 'signature', label: 'Signature Field', icon: Type, defaultLabel: 'Digital Signature' }
  ],
  layout: [
    { type: 'divider', label: 'Section Divider', icon: Sliders },
    { type: 'heading', label: 'Heading', icon: Type, defaultLabel: 'Section Title' },
    { type: 'paragraph', label: 'Paragraph Text', icon: FileText, defaultLabel: 'Write instructions or additional description here.' },
    { type: 'imageBlock', label: 'Image Block', icon: Image }
  ]
};

const getInputIcon = (type) => {
  switch (type) {
    case 'email': return Mail;
    case 'phone': return Phone;
    case 'number': return Hash;
    case 'url': return Link2;
    case 'longText': return FileText;
    default: return Type;
  }
};

const FormBuilderEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' or 'settings'
  const [editorMobileTab, setEditorMobileTab] = useState('canvas'); // 'toolbox' | 'canvas' | 'properties'
  const [activePropertySection, setActivePropertySection] = useState('general'); // 'general' | 'validation' | 'visibility'
  
  // Form Details
  const [formTitle, setFormTitle] = useState('New Custom Form');
  const [formDescription, setFormDescription] = useState('Please fill out this form.');
  const [formStatus, setFormStatus] = useState('draft');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  // Form Settings
  const [settings, setSettings] = useState({
    successMessage: 'Thank you! Your response has been submitted.',
    redirectUrl: '',
    submissionLimit: '',
    startDate: '',
    endDate: '',
    allowMultiple: true,
    enableCaptcha: true,
    collectIp: true,
    collectTimestamp: true
  });

  // Fields and selections
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [deletedFieldIds, setDeletedFieldIds] = useState([]);

  // Fetch form to edit
  useEffect(() => {
    if (isEditMode) {
      loadFormDetails();
    }
  }, [id]);

  const loadFormDetails = async () => {
    try {
      setLoading(true);
      const formData = await getFormDetails(id);
      if (!formData) {
        alert("Form not found!");
        navigate('/form-builder');
        return;
      }
      
      setFormTitle(formData.title || '');
      setFormDescription(formData.description || '');
      setFormStatus(formData.status || 'draft');
      setLogoUrl(formData.settings?.logoUrl || '');
      
      setSettings({
        successMessage: formData.settings?.successMessage || 'Thank you! Your response has been submitted.',
        redirectUrl: formData.settings?.redirectUrl || '',
        submissionLimit: formData.settings?.submissionLimit || '',
        startDate: formData.settings?.startDate || '',
        endDate: formData.settings?.endDate || '',
        allowMultiple: formData.settings?.allowMultiple ?? true,
        enableCaptcha: formData.settings?.enableCaptcha ?? true,
        collectIp: formData.settings?.collectIp ?? true,
        collectTimestamp: formData.settings?.collectTimestamp ?? true
      });

      // Fetch Fields
      const fetchedFields = await fetchFormFields(id);
      setFields(fetchedFields);
      if (fetchedFields.length > 0) {
        setSelectedFieldId(fetchedFields[0].id);
      }
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      setLogoUrl(data.secure_url);
    } catch (err) {
      console.error("Logo upload error:", err);
    } finally {
      setLogoUploading(false);
    }
  };

  const addField = (preset) => {
    const newFieldId = `field-${Date.now()}`;
    const newField = {
      id: newFieldId,
      type: preset.type,
      label: preset.defaultLabel || preset.label || 'Label',
      placeholder: preset.placeholder || '',
      helpText: '',
      required: false,
      defaultValue: preset.defaultValue || '',
      validation: {
        minLength: '',
        maxLength: '',
        maxFileSize: preset.maxFileSize || 5,
        ratingMax: preset.ratingMax || 5
      },
      options: preset.options ? [...preset.options] : [],
      visibleIf: {
        fieldId: '',
        value: ''
      },
      sortOrder: fields.length
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newFieldId);
    setEditorMobileTab('canvas');
  };

  const removeField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
    if (isEditMode) {
      setDeletedFieldIds([...deletedFieldIds, fieldId]);
    }
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const listCopy = [...fields];
    
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    // Re-calculate sortOrder
    const updated = listCopy.map((item, idx) => ({
      ...item,
      sortOrder: idx
    }));

    setFields(updated);
  };

  const updateFieldProperty = (fieldId, property, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, [property]: value };
      }
      return f;
    }));
  };

  const updateFieldValidation = (fieldId, key, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          validation: {
            ...f.validation,
            [key]: value
          }
        };
      }
      return f;
    }));
  };

  const updateFieldVisibleIf = (fieldId, key, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          visibleIf: {
            ...f.visibleIf,
            [key]: value
          }
        };
      }
      return f;
    }));
  };

  const handleAddFieldOption = (fieldId) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`]
        };
      }
      return f;
    }));
  };

  const handleRemoveFieldOption = (fieldId, index) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const nextOpts = [...(f.options || [])];
        nextOpts.splice(index, 1);
        return { ...f, options: nextOpts };
      }
      return f;
    }));
  };

  const handleUpdateFieldOption = (fieldId, index, value) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const nextOpts = [...(f.options || [])];
        nextOpts[index] = value;
        return { ...f, options: nextOpts };
      }
      return f;
    }));
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      alert("Form Title is required.");
      return;
    }

    try {
      setSaving(true);
      const formId = isEditMode ? id : await getNextFormId();
      
      const formDocData = {
        title: formTitle,
        description: formDescription,
        status: formStatus,
        settings: {
          ...settings,
          logoUrl
        },
        updatedAt: new Date().toISOString(),
        ...(isEditMode ? {} : { 
          createdBy: currentUser?.email || 'Admin',
          createdAt: new Date().toISOString()
        })
      };

      // Set sort order on fields
      const sortedFields = fields.map((f, idx) => ({
        ...f,
        sortOrder: idx
      }));

      // Save Form and Fields via dbHelper
      await saveFormObj(formId, formDocData, sortedFields, deletedFieldIds);

      // Record logs
      const action = isEditMode ? 'Form Updated' : 'Form Created';
      await createAuditLogObj(action, formId, formTitle, currentUser?.email || 'Admin');

      // Return dashboard
      navigate('/form-builder');
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save the form. Check console logs.");
    } finally {
      setSaving(false);
    }
  };

  const activeField = fields.find(f => f.id === selectedFieldId);

  // Field type list mapping for selecting trigger conditions
  const eligibleConditionFields = fields.filter(f => 
    f.id !== selectedFieldId && 
    ['radio', 'dropdown', 'checkbox', 'toggle'].includes(f.type)
  );

  return (
    <div className="space-y-6 bg-transparent pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111]/60 backdrop-blur-md p-6 rounded-3xl border border-[#222222]/50 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-3">
          <Link to="/form-builder" className="p-2.5 bg-black/40 border border-[#222222]/40 hover:border-yellow-500/40 hover:bg-[#1A1A1A]/65 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer hover:scale-[1.05] active:scale-95 duration-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{isEditMode ? 'Edit Custom Form' : 'Create Custom Form'}</h2>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">Interactive WYSIWYG form designer and options config</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <select 
            value={formStatus} 
            onChange={(e) => setFormStatus(e.target.value)}
            className={`rounded-xl border bg-black/60 px-4 py-2.5 text-xs font-bold transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-yellow-500/50 ${
              formStatus === 'published' 
                ? 'border-yellow-500/30 text-yellow-400' 
                : formStatus === 'archived' 
                  ? 'border-gray-500/30 text-gray-400' 
                  : 'border-yellow-500/30 text-yellow-400'
            }`}
          >
            <option value="draft" className="bg-black text-yellow-400 font-bold">Draft</option>
            <option value="published" className="bg-black text-yellow-400 font-bold">Published</option>
            <option value="archived" className="bg-black text-gray-400 font-bold">Archived</option>
          </select>

          <button
            onClick={handleSaveForm}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-indigo-600 hover:from-yellow-300 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      {loading ? (
        <div className="bg-[#111111]/60 backdrop-blur-md border border-[#222222]/50 rounded-3xl p-24 text-center text-white shadow-xl">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="font-bold text-sm tracking-wide text-gray-300">Loading custom form workspace...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Editor Tab Selector (only visible on mobile/tablet) */}
          <div className="flex lg:hidden bg-[#111111]/40 backdrop-blur-md border border-[#222222]/40 p-1.5 rounded-2xl shadow-inner">
            <button
              type="button"
              onClick={() => setEditorMobileTab('toolbox')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                editorMobileTab === 'toolbox' 
                  ? 'bg-gradient-to-r from-yellow-400 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🛠️ Toolbox
            </button>
            <button
              type="button"
              onClick={() => setEditorMobileTab('canvas')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                editorMobileTab === 'canvas' 
                  ? 'bg-gradient-to-r from-yellow-400 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📱 Canvas
            </button>
            <button
              type="button"
              onClick={() => setEditorMobileTab('properties')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                editorMobileTab === 'properties' 
                  ? 'bg-gradient-to-r from-yellow-400 to-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚙️ Properties
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PANEL: Field Toolbox (3 cols) */}
            <div className={`lg:col-span-3 space-y-6 bg-[#111111]/60 backdrop-blur-md p-5 rounded-3xl border border-[#222222]/50 shadow-xl animate-in fade-in duration-350 ${editorMobileTab === 'toolbox' ? 'block' : 'hidden lg:block'}`}>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-wide">Field Toolbox</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Click a component to append it to the form canvas</p>
              </div>
              
              <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
                {[
                  { name: 'Basic Fields', list: FIELD_TYPES.basic, iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
                  { name: 'Selection Fields', list: FIELD_TYPES.selection, iconColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
                  { name: 'Advanced Fields', list: FIELD_TYPES.advanced, iconColor: 'text-pink-400 bg-pink-500/10 border-pink-500/25' },
                  { name: 'Layout Elements', list: FIELD_TYPES.layout, iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25' }
                ].map((grp, idx) => (
                  <div key={idx} className="space-y-2.5 animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{grp.name}</span>
                      <div className="h-[1px] flex-1 bg-[#222222]/40"></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      {grp.list.map((preset) => {
                        const Icon = preset.icon;
                        return (
                          <button
                            key={preset.type}
                            onClick={() => addField(preset)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-gray-300 hover:text-white bg-black/40 border border-[#222222]/40 hover:border-yellow-500/40 hover:bg-[#1A1A1A]/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer group"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${grp.iconColor} group-hover:scale-105 duration-200`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER PANEL: Canvas/Form Preview (5 cols) */}
            <div className={`lg:col-span-5 space-y-4 ${editorMobileTab === 'canvas' ? 'block' : 'hidden lg:block'}`}>
              
              {/* Tab Selector */}
              <div className="flex bg-[#111111]/40 backdrop-blur-md border border-[#222222]/50 p-1.5 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'builder' 
                      ? 'bg-gradient-to-r from-yellow-400 to-indigo-600 text-white shadow-md shadow-yellow-500/10' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Form Canvas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                    activeTab === 'settings' 
                      ? 'bg-gradient-to-r from-yellow-400 to-indigo-600 text-white shadow-md shadow-yellow-500/10' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Form Settings
                </button>
              </div>

              {activeTab === 'builder' ? (
                <div className="flex flex-col shadow-2xl animate-in fade-in duration-300">
                  {/* Mock Browser Header */}
                  <div className="bg-[#111111]/90 border border-[#222222]/60 border-b-0 rounded-t-3xl p-4 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-md"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-md"></span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-md"></span>
                    </div>
                    <div className="flex-1 max-w-xs md:max-w-md mx-auto bg-black/80 border border-[#222222]/40 rounded-xl py-1 px-3 text-[10px] text-gray-400 font-mono tracking-tight flex items-center justify-center gap-1.5 shadow-inner select-none truncate">
                      <span className="text-gray-500">https://</span>
                      <span>cgs-admin.org/forms/{formTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'new-form'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-40">
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                    </div>
                  </div>

                  {/* Canvas Container */}
                  <div className="bg-[#111111]/60 backdrop-blur-md rounded-b-3xl border border-[#222222]/60 p-6 md:p-8 space-y-6 min-h-[500px] relative shadow-2xl">
                    
                    {/* Logo indicator if uploaded */}
                    {logoUrl && (
                      <div className="w-16 h-16 rounded-2xl border border-[#222222]/80 overflow-hidden bg-white flex items-center justify-center p-1.5 mb-2 shadow-lg animate-in zoom-in duration-200">
                        <img src={logoUrl} alt="Form Logo" className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Form Title details */}
                    <div className="border-l-2 border-yellow-500 pl-4 space-y-1 mb-6">
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full text-xl md:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-yellow-500 focus:outline-none transition-all py-1"
                        placeholder="Untitled Custom Form"
                      />
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full text-gray-400 text-xs md:text-sm bg-transparent border-b border-transparent hover:border-gray-800/80 focus:border-yellow-500 focus:outline-none transition-all py-1 resize-none mt-1 leading-relaxed"
                        rows="2"
                        placeholder="Describe your form so submitters understand instructions..."
                      />
                    </div>

                    {/* Dynamic Fields List */}
                    <div className="space-y-4">
                      {fields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-gray-400 border border-dashed border-yellow-500/20 rounded-2xl bg-black/20 relative overflow-hidden group select-none">
                          <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>
                          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>
                          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A]/50 border border-gray-700/50 flex items-center justify-center mb-4 text-yellow-400 group-hover:scale-110 group-hover:border-yellow-500/40 group-hover:shadow-lg transition-all duration-300">
                            <PlusCircle className="w-8 h-8 animate-pulse text-yellow-500" />
                          </div>
                          <h4 className="text-sm font-bold text-white tracking-wide">Your form canvas is empty</h4>
                          <p className="text-xs text-gray-500 text-center max-w-[240px] mt-1.5 leading-relaxed font-semibold">
                            Click blocks in the <strong className="text-yellow-400">Toolbox</strong> on the left to start building your custom form.
                          </p>
                        </div>
                      ) : (
                        fields.map((field, index) => {
                          const isSelected = field.id === selectedFieldId;
                          const InputIcon = getInputIcon(field.type);
                          return (
                            <div 
                              key={field.id}
                              onClick={() => { setSelectedFieldId(field.id); setEditorMobileTab('properties'); }}
                              className={`relative p-5 rounded-2xl border transition-all cursor-pointer group/field ${
                                isSelected 
                                  ? 'bg-[#1A1A1A]/65 border-yellow-500 shadow-xl shadow-yellow-500/5 ring-1 ring-yellow-500/20' 
                                  : 'bg-black/40 border-[#222222]/50 hover:border-gray-600'
                              }`}
                            >
                              {/* Field actions */}
                              <div className={`absolute -top-3.5 right-4 z-10 flex items-center gap-1.5 scale-95 opacity-0 group-hover/field:scale-100 group-hover/field:opacity-100 focus-within:opacity-100 focus-within:scale-100 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : ''}`}>
                                <span className="text-[8px] font-black text-yellow-400 bg-gray-900 border border-yellow-500/30 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md select-none">
                                  {field.type}
                                </span>
                                <div className="flex items-center gap-1 bg-[#111111] border border-[#222222] p-0.5 rounded-lg shadow-lg">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                                    disabled={index === 0}
                                    className="p-1 hover:bg-[#222222] rounded text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                                    disabled={index === fields.length - 1}
                                    className="p-1 hover:bg-[#222222] rounded text-gray-400 disabled:opacity-20 cursor-pointer transition-colors"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded cursor-pointer transition-colors"
                                    title="Delete Field"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Field content view */}
                              <div className="space-y-2">
                                {field.type === 'divider' ? (
                                  <div className="py-3 flex items-center gap-3 select-none">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#222222]/80"></div>
                                    <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase">Divider</span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#222222]/80 to-transparent"></div>
                                  </div>
                                ) : field.type === 'heading' ? (
                                  <div className="py-1 border-l-2 border-yellow-500 pl-3">
                                    <h4 className="text-base md:text-lg font-black text-gray-100 tracking-tight leading-snug">{field.label || 'Heading Title'}</h4>
                                  </div>
                                ) : field.type === 'paragraph' ? (
                                  <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed font-semibold bg-black/25 p-3.5 border border-[#222222]/40 rounded-xl">{field.label || 'Paragraph context description...'}</p>
                                ) : field.type === 'imageBlock' ? (
                                  <div className="w-full h-36 bg-black/40 border border-[#222222]/60 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs font-bold gap-2 p-4 select-none shadow-inner group/imgblock">
                                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A]/50 border border-[#222222] flex items-center justify-center text-gray-400 group-hover/imgblock:text-yellow-400 transition-colors">
                                      <Image className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">Image Block Preview</span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300 flex items-center gap-1">
                                      {field.label || 'Untitled Field'}
                                      {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {/* Inputs WYSIWYG representations */}
                                    {['shortText', 'longText', 'email', 'phone', 'number', 'url'].includes(field.type) && (
                                      <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                                          <InputIcon className="w-4 h-4" />
                                        </div>
                                        <div className="text-[11px] font-semibold text-gray-400 bg-black/40 border border-[#222222]/50 pl-10 pr-3.5 py-3 rounded-xl cursor-default flex items-center justify-between transition-colors shadow-inner">
                                          <span>{field.placeholder || `Enter ${field.label || 'value'}...`}</span>
                                          {field.helpText && <HelpCircle className="w-3.5 h-3.5 text-gray-600" />}
                                        </div>
                                      </div>
                                    )}

                                    {field.type === 'dropdown' && (
                                      <div className="text-[11px] font-semibold text-gray-400 bg-black/40 border border-[#222222]/50 px-3.5 py-3 rounded-xl cursor-default flex items-center justify-between shadow-inner">
                                        <span>{field.placeholder || 'Select option...'}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                      </div>
                                    )}

                                    {field.type === 'multiSelect' && (
                                      <div className="min-h-[42px] font-semibold bg-black/40 border border-[#222222]/50 px-3 py-2 rounded-xl cursor-default flex flex-wrap items-center gap-1.5 shadow-inner">
                                        {(field.options && field.options.length > 0 ? field.options.slice(0, 2) : ['Option A', 'Option B']).map((opt, oIdx) => (
                                          <span key={oIdx} className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-lg">
                                            {opt}
                                          </span>
                                        ))}
                                        <span className="text-[10px] text-gray-500 ml-auto select-none">+ Select Multiple</span>
                                      </div>
                                    )}

                                    {field.type === 'radio' && (
                                      <div className="space-y-2.5 mt-1 px-1">
                                        {(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map((opt, oIdx) => (
                                          <div key={oIdx} className="flex items-center gap-2.5">
                                            <div className="w-4 h-4 rounded-full border border-[#222222] flex items-center justify-center bg-black/50 shadow-inner">
                                              {oIdx === 0 && <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-indigo-500"></div>}
                                            </div>
                                            <span className="text-xs text-gray-300 font-semibold">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {field.type === 'checkbox' && (
                                      <div className="space-y-2.5 mt-1 px-1">
                                        {(field.options && field.options.length > 0 ? field.options : ['Option A', 'Option B']).map((opt, oIdx) => (
                                          <div key={oIdx} className="flex items-center gap-2.5">
                                            <div className="w-4 h-4 rounded-md border border-[#222222] flex items-center justify-center bg-black/50 shadow-inner">
                                              {oIdx === 0 && <Check className="w-3 h-3 text-yellow-400" />}
                                            </div>
                                            <span className="text-xs text-gray-300 font-semibold">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {['date', 'time'].includes(field.type) && (
                                      <div className="text-[11px] font-semibold text-gray-400 bg-black/40 border border-[#222222]/50 px-3.5 py-3 rounded-xl cursor-default flex items-center justify-between shadow-inner">
                                        <span>{field.placeholder || (field.type === 'date' ? 'YYYY-MM-DD' : 'HH:MM')}</span>
                                        {field.type === 'date' ? <Calendar className="w-4 h-4 text-gray-500" /> : <Clock className="w-4 h-4 text-gray-500" />}
                                      </div>
                                    )}

                                    {['fileUpload', 'imageUpload'].includes(field.type) && (
                                      <div className="w-full border-2 border-dashed border-[#222222] hover:border-yellow-500/50 bg-black/25 hover:bg-[#1A1A1A]/20 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-default group/upload shadow-inner">
                                        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A]/50 border border-[#222222] flex items-center justify-center text-gray-400 group-hover/upload:text-yellow-400 group-hover/upload:border-yellow-500/30 transition-all mb-2">
                                          {field.type === 'imageUpload' ? <Image className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-300">Drag & drop or <span className="text-yellow-400 hover:underline">browse</span> files</p>
                                        <p className="text-[9px] text-gray-500 mt-1 font-semibold">Max file limit: {field.validation?.maxFileSize || 5}MB</p>
                                      </div>
                                    )}

                                    {field.type === 'rating' && (
                                      <div className="flex items-center gap-1.5 mt-2 select-none">
                                        {Array.from({ length: field.validation?.ratingMax || 5 }).map((_, rIdx) => (
                                          <Star key={rIdx} className="w-6 h-6 text-yellow-500 fill-yellow-500/10 hover:fill-yellow-500 hover:scale-110 transition-all cursor-pointer" />
                                        ))}
                                        <span className="text-[9px] text-gray-500 ml-2 font-bold uppercase tracking-widest">({field.validation?.ratingMax || 5} stars)</span>
                                      </div>
                                    )}

                                    {field.type === 'toggle' && (
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <div className="w-10 h-5.5 rounded-full bg-yellow-500 border border-yellow-500/30 p-0.5 flex items-center cursor-pointer transition-colors">
                                          <div className="w-4.5 h-4.5 rounded-full bg-white shadow trangray-x-4.5 transition-transform"></div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-300 capitalize">{field.defaultValue || 'Yes'}</span>
                                      </div>
                                    )}

                                    {field.type === 'signature' && (
                                      <div className="w-full h-24 bg-black/40 border border-[#222222]/50 rounded-xl relative flex flex-col justify-end p-3 overflow-hidden shadow-inner group/sig">
                                        <svg className="absolute inset-0 w-full h-full opacity-20 text-gray-500 p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                                          <path d="M10 80 Q 20 20, 40 50 T 70 30 T 90 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                        <div className="w-full border-t border-dashed border-[#222222]/80 flex items-center justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest pt-1.5 select-none">
                                          <span>Digital Signature Pad</span>
                                          <span>✗ Clear</span>
                                        </div>
                                      </div>
                                    )}

                                    {field.helpText && <p className="text-[10px] text-gray-500 font-bold italic mt-1 pl-1">{field.helpText}</p>}
                                    
                                    {field.visibleIf?.fieldId && (
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2.5 rounded-lg bg-violet-900/20 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase tracking-wide shadow-sm select-none">
                                        <Sliders className="w-2.5 h-2.5" />
                                        Conditional Visibility Trigger Active
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM SETTINGS CARD */
                <div className="bg-[#111111]/60 backdrop-blur-md rounded-3xl border border-[#222222]/60 p-6 md:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-wide">General Form Settings</h3>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">Control form details, submission rules, and accessibility logs</p>
                  </div>
                  
                  <div className="space-y-5">
                    {/* Logo block */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo / Header Image</label>
                      <div className="flex items-center gap-4 bg-black/25 p-4 border border-[#222222]/40 rounded-2xl shadow-inner">
                        {logoUrl && (
                          <div className="w-14 h-14 rounded-xl bg-white border border-[#222222]/85 overflow-hidden flex items-center justify-center p-1 shadow-md">
                            <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          <label className="inline-flex items-center justify-center gap-2 border border-[#222222] hover:border-yellow-500/40 hover:bg-[#1A1A1A]/65 text-gray-300 hover:text-white font-bold text-xs px-4 py-3 rounded-xl cursor-pointer transition-all w-full select-none shadow-sm active:scale-98">
                            <Upload className="w-3.5 h-3.5" />
                            {logoUploading ? 'Uploading Logo...' : logoUrl ? 'Change Logo Image' : 'Upload Form Logo'}
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                          {logoUrl && (
                            <button 
                              onClick={() => setLogoUrl('')}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold mt-2 hover:underline cursor-pointer block select-none"
                            >
                              Remove logo image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Success message */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmation Message</label>
                      <input
                        type="text"
                        value={settings.successMessage}
                        onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
                        className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                        placeholder="e.g. Thank you! Your response has been submitted."
                      />
                    </div>

                    {/* Redirect URL */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Redirect URL after submission</label>
                      <input
                        type="text"
                        value={settings.redirectUrl}
                        onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
                        className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                        placeholder="https://company.com/thank-you (Optional)"
                      />
                    </div>

                    {/* Submission limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submission Limit</label>
                        <input
                          type="number"
                          value={settings.submissionLimit}
                          onChange={(e) => setSettings({ ...settings, submissionLimit: e.target.value })}
                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-4 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                          placeholder="Unlimited"
                        />
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center justify-between p-3.5 bg-black/25 border border-[#222222]/50 rounded-xl cursor-pointer hover:bg-[#1A1A1A]/20 transition-colors select-none">
                          <span className="text-xs font-bold text-gray-300">Allow Multi-Submission</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={settings.allowMultiple}
                              onChange={(e) => setSettings({ ...settings, allowMultiple: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-black border border-[#222222] rounded-full peer peer-checked:bg-yellow-500 peer-checked:border-yellow-500/30 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:trangray-x-4"></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Start/End dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
                        <input
                          type="datetime-local"
                          value={settings.startDate}
                          onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 transition-all cursor-pointer font-semibold shadow-inner"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Date</label>
                        <input
                          type="datetime-local"
                          value={settings.endDate}
                          onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 transition-all cursor-pointer font-semibold shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Security options switch layout */}
                    <div className="space-y-3 pt-4 border-t border-[#222222]/60">
                      <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Security & Data Collection</div>
                      
                      {[
                        { key: 'enableCaptcha', label: 'Bot Verification (CAPTCHA)', desc: 'Spam protection using bot verification' },
                        { key: 'collectIp', label: 'Collect Submitter IP Address', desc: 'Secure track submitter geolocation logs' },
                        { key: 'collectTimestamp', label: 'Collect Time Details', desc: 'Record milliseconds precision timestamps' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-3.5 bg-black/25 border border-[#222222]/55 rounded-2xl cursor-pointer hover:bg-[#1A1A1A]/20 transition-colors select-none">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-200">{item.label}</span>
                            <span className="text-[9px] text-gray-500 font-semibold mt-0.5">{item.desc}</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={settings[item.key]}
                              onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-black border border-[#222222] rounded-full peer peer-checked:bg-yellow-500 peer-checked:border-yellow-500/30 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:trangray-x-4"></div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: Field Configurations (4 cols) */}
            <div className={`lg:col-span-4 bg-[#111111]/60 backdrop-blur-md p-5 rounded-3xl border border-[#222222]/50 shadow-xl min-h-[500px] animate-in fade-in duration-350 ${editorMobileTab === 'properties' ? 'block' : 'hidden lg:block'}`}>
              <div>
                <h3 className="text-sm font-extrabold text-white tracking-wide">Properties Config</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Select a block on the canvas to configure settings</p>
              </div>

              {activeField ? (
                <div className="mt-6 space-y-5 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-black/40 border border-[#222222]/60 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-lg">
                        {activeField.type}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeField(activeField.id)}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:scale-[1.05] active:scale-95 duration-200"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Property Tabs */}
                  <div className="flex bg-black/40 border border-[#222222]/50 p-1 rounded-xl shadow-inner">
                    <button
                      type="button"
                      onClick={() => setActivePropertySection('general')}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                        activePropertySection === 'general'
                          ? 'bg-[#1A1A1A] text-yellow-400 border border-[#222222]/60 shadow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      General
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePropertySection('validation')}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                        activePropertySection === 'validation'
                          ? 'bg-[#1A1A1A] text-yellow-400 border border-[#222222]/60 shadow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Rules
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePropertySection('visibility')}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                        activePropertySection === 'visibility'
                          ? 'bg-[#1A1A1A] text-yellow-400 border border-[#222222]/60 shadow'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Visibility
                    </button>
                  </div>

                  {/* Properties fields conditionally rendered */}
                  <div className="space-y-4 min-h-[300px] animate-in fade-in duration-200">
                    
                    {activePropertySection === 'general' && (
                      <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                        {/* Label config */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Field Label Title</label>
                          <input
                            type="text"
                            value={activeField.label}
                            onChange={(e) => updateFieldProperty(activeField.id, 'label', e.target.value)}
                            className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-3.5 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                            placeholder="e.g. Enter full name"
                          />
                        </div>

                        {/* Placeholder */}
                        {!['divider', 'heading', 'paragraph', 'imageBlock', 'date', 'time', 'rating', 'toggle', 'signature'].includes(activeField.type) && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Placeholder Text</label>
                            <input
                              type="text"
                              value={activeField.placeholder}
                              onChange={(e) => updateFieldProperty(activeField.id, 'placeholder', e.target.value)}
                              className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-3.5 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                              placeholder="e.g. Type here..."
                            />
                          </div>
                        )}

                        {/* Help text */}
                        {!['divider', 'imageBlock'].includes(activeField.type) && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Guidance Description</label>
                            <input
                              type="text"
                              value={activeField.helpText}
                              onChange={(e) => updateFieldProperty(activeField.id, 'helpText', e.target.value)}
                              className="w-full rounded-xl border border-[#222222]/60 bg-black/40 px-3.5 py-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                              placeholder="e.g. Sub-text guide details"
                            />
                          </div>
                        )}

                        {/* Selection Choices List */}
                        {['dropdown', 'radio', 'checkbox', 'multiSelect'].includes(activeField.type) && (
                          <div className="space-y-2.5 pt-3 border-t border-[#222222]/40">
                            <div className="flex justify-between items-center px-0.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selection Choices</label>
                              <button
                                type="button"
                                onClick={() => handleAddFieldOption(activeField.id)}
                                className="text-[10px] font-black text-yellow-400 hover:text-yellow-300 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Option
                              </button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {activeField.options?.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2 animate-in slide-in-from-bottom-1 duration-200">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateFieldOption(activeField.id, oIdx, e.target.value)}
                                    className="flex-1 rounded-xl border border-[#222222]/60 bg-black/40 p-2.5 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFieldOption(activeField.id, oIdx)}
                                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl cursor-pointer transition-all active:scale-90"
                                    title="Delete option"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activePropertySection === 'validation' && (
                      <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                        {/* Required toggle switch */}
                        {!['divider', 'heading', 'paragraph', 'imageBlock'].includes(activeField.type) ? (
                          <div className="space-y-3">
                            <label className="flex items-center justify-between p-3.5 bg-black/25 border border-[#222222]/50 rounded-2xl cursor-pointer hover:bg-[#1A1A1A]/25 transition-colors select-none shadow-sm">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-200">Required Field</span>
                                <span className="text-[9px] text-gray-500 font-semibold mt-0.5">Force submitters to fill this block</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={activeField.required}
                                  onChange={(e) => updateFieldProperty(activeField.id, 'required', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-black border border-[#222222] rounded-full peer peer-checked:bg-yellow-500 peer-checked:border-yellow-500/30 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:trangray-x-4"></div>
                              </div>
                            </label>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-bold p-6 border border-dashed border-[#222222]/80 rounded-2xl text-center bg-black/10 select-none animate-in fade-in duration-200">
                            No validation constraints applicable for layout modules
                          </div>
                        )}

                        {/* Text inputs min/max length */}
                        {['shortText', 'longText'].includes(activeField.type) && (
                          <div className="grid grid-cols-2 gap-3 mt-2 border-t border-[#222222]/40 pt-4 animate-in fade-in duration-200">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Min Characters</label>
                              <input
                                type="number"
                                value={activeField.validation?.minLength || ''}
                                onChange={(e) => updateFieldValidation(activeField.id, 'minLength', e.target.value)}
                                className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Max Characters</label>
                              <input
                                type="number"
                                value={activeField.validation?.maxLength || ''}
                                onChange={(e) => updateFieldValidation(activeField.id, 'maxLength', e.target.value)}
                                className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                              />
                            </div>
                          </div>
                        )}

                        {/* File size limits */}
                        {['fileUpload', 'imageUpload'].includes(activeField.type) && (
                          <div className="space-y-1.5 mt-2 border-t border-[#222222]/40 pt-4 animate-in fade-in duration-200">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Max Allowed File Size (MB)</label>
                            <input
                              type="number"
                              value={activeField.validation?.maxFileSize || 5}
                              onChange={(e) => updateFieldValidation(activeField.id, 'maxFileSize', e.target.value)}
                              className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-white focus:outline-none focus:border-yellow-500 transition-all font-semibold shadow-inner"
                              placeholder="5"
                            />
                          </div>
                        )}

                        {/* Rating scale limit */}
                        {activeField.type === 'rating' && (
                          <div className="space-y-1.5 mt-2 border-t border-[#222222]/40 pt-4 animate-in fade-in duration-200">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rating Scale Maximum</label>
                            <select
                              value={activeField.validation?.ratingMax || 5}
                              onChange={(e) => updateFieldValidation(activeField.id, 'ratingMax', parseInt(e.target.value))}
                              className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 transition-all cursor-pointer font-semibold shadow-inner"
                            >
                              <option value="5" className="bg-black text-white">5 Star Scale</option>
                              <option value="10" className="bg-black text-white">10 Star Scale</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {activePropertySection === 'visibility' && (
                      <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                        {!['divider'].includes(activeField.type) ? (
                          <div className="space-y-3">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Conditional Rendering Rules</div>
                            
                            <div className="p-4 bg-black/25 border border-[#222222]/60 rounded-2xl space-y-3 shadow-inner">
                              <div className="text-[10px] font-bold text-gray-300">IF Question Block:</div>
                              <select
                                value={activeField.visibleIf?.fieldId || ''}
                                onChange={(e) => {
                                  updateFieldVisibleIf(activeField.id, 'fieldId', e.target.value);
                                  updateFieldVisibleIf(activeField.id, 'value', '');
                                }}
                                className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 cursor-pointer font-semibold shadow-inner"
                              >
                                <option value="" className="bg-black">Always Visible (None)</option>
                                {eligibleConditionFields.map(f => (
                                  <option key={f.id} value={f.id} className="bg-black">{f.label || f.id}</option>
                                ))}
                              </select>

                              {activeField.visibleIf?.fieldId && (
                                <>
                                  <div className="text-[10px] font-bold text-gray-300 mt-2">EQUALS selected value:</div>
                                  
                                  {(() => {
                                    const targetField = fields.find(f => f.id === activeField.visibleIf.fieldId);
                                    if (targetField?.options && targetField.options.length > 0) {
                                      return (
                                        <select
                                          value={activeField.visibleIf?.value || ''}
                                          onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 cursor-pointer font-semibold shadow-inner"
                                        >
                                          <option value="" className="bg-black">Select option...</option>
                                          {targetField.options.map((opt, idx) => (
                                            <option key={idx} value={opt} className="bg-black">{opt}</option>
                                          ))}
                                        </select>
                                      );
                                    } else if (targetField?.type === 'toggle') {
                                      return (
                                        <select
                                          value={activeField.visibleIf?.value || ''}
                                          onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-gray-300 focus:outline-none focus:border-yellow-500 cursor-pointer font-semibold shadow-inner"
                                        >
                                          <option value="" className="bg-black">Select value...</option>
                                          <option value="yes" className="bg-black">Yes</option>
                                          <option value="no" className="bg-black">No</option>
                                        </select>
                                      );
                                    } else {
                                      return (
                                        <input
                                          type="text"
                                          value={activeField.visibleIf?.value || ''}
                                          onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                          className="w-full rounded-xl border border-[#222222]/60 bg-black/40 p-3 text-xs text-white focus:outline-none focus:border-yellow-500 font-semibold shadow-inner"
                                          placeholder="Enter equality value"
                                        />
                                      );
                                    }
                                  })()}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-bold p-6 border border-dashed border-[#222222]/80 rounded-2xl text-center bg-black/10 select-none animate-in fade-in duration-200">
                            Conditional rendering rules not applicable for divider layouts
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500 text-center select-none">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[#222222]/60 flex items-center justify-center mb-3">
                    <Sliders className="w-5 h-5 text-gray-500 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-gray-300">No active block selected</p>
                  <p className="text-[9px] text-gray-500 mt-1 max-w-[180px] font-semibold">Select a custom field card on the form canvas to edit properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderEditor;
