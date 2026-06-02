import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Settings, Sliders, Type, HelpCircle,
  Hash, Mail, Phone, Link2, List, CheckSquare, Radio, Calendar, Clock, Upload, Image, 
  Star, ToggleLeft, Save, PlusCircle, CheckCircle, AlertCircle, AlertTriangle, FileText
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

const FormBuilderEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' or 'settings'
  
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-lg">
        <div className="flex items-center gap-3">
          <Link to="/form-builder" className="p-2 hover:bg-[#1E243D] text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{isEditMode ? 'Edit Custom Form' : 'Create Custom Form'}</h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Drag-and-drop or select components to design your form</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <select 
            value={formStatus} 
            onChange={(e) => setFormStatus(e.target.value)}
            className="rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={handleSaveForm}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {/* Editor Main Content */}
      {loading ? (
        <div className="bg-[#131726]/80 border border-[#2D334A]/50 rounded-3xl p-16 text-center text-white">
          <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="font-semibold text-sm">Loading editor...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Field Toolbox (3 cols) */}
          <div className="lg:col-span-3 space-y-5 bg-[#131726]/60 backdrop-blur-md p-5 rounded-3xl border border-[#2D334A]/50 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white">Field Toolbox</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Click fields below to add to form</p>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {[
                { name: 'Basic Fields', list: FIELD_TYPES.basic },
                { name: 'Selection Fields', list: FIELD_TYPES.selection },
                { name: 'Advanced Fields', list: FIELD_TYPES.advanced },
                { name: 'Layout Elements', list: FIELD_TYPES.layout }
              ].map((grp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1.5">{grp.name}</div>
                  <div className="grid grid-cols-1 gap-1">
                    {grp.list.map((preset) => {
                      const Icon = preset.icon;
                      return (
                        <button
                          key={preset.type}
                          onClick={() => addField(preset)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white bg-[#0B0F19]/40 border border-[#2D334A]/40 hover:border-violet-500/30 hover:bg-[#1E243D]/50 transition-all cursor-pointer group"
                        >
                          <div className="w-6 h-6 bg-slate-900 border border-[#2D334A]/60 rounded-md flex items-center justify-center text-slate-400 group-hover:text-violet-400 transition-colors">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER PANEL: Canvas/Form Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Tab Selector */}
            <div className="flex bg-[#131726]/60 border border-[#2D334A]/50 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('builder')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'builder' 
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Form Canvas
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Form Settings
              </button>
            </div>

            {activeTab === 'builder' ? (
              <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-6 md:p-8 space-y-6 shadow-xl relative min-h-[500px]">
                
                {/* Logo indicator if uploaded */}
                {logoUrl && (
                  <div className="w-16 h-16 rounded-2xl border border-[#2D334A] overflow-hidden bg-white flex items-center justify-center p-1.5 mb-2">
                    <img src={logoUrl} alt="Form Logo" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Form Title details */}
                <div className="border-b border-[#2D334A]/60 pb-6">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-violet-500 focus:outline-none transition-all py-1"
                    placeholder="Form Title"
                  />
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full text-slate-400 text-sm bg-transparent border-b border-transparent hover:border-slate-700 focus:border-violet-500 focus:outline-none transition-all py-1 resize-none mt-2"
                    rows="2"
                    placeholder="Describe your form..."
                  />
                </div>

                {/* Dynamic Fields List */}
                <div className="space-y-4">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 border border-dashed border-[#2D334A]/80 rounded-2xl bg-[#0B0F19]/20">
                      <PlusCircle className="w-10 h-10 mb-2 text-slate-600 animate-pulse" />
                      <p className="text-xs font-bold">Your form canvas is empty</p>
                      <p className="text-[10px] text-slate-500 mt-1">Select field blocks from the toolbox to start building</p>
                    </div>
                  ) : (
                    fields.map((field, index) => {
                      const isSelected = field.id === selectedFieldId;
                      return (
                        <div 
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#1E243D]/65 border-violet-500 shadow-md shadow-violet-500/5' 
                              : 'bg-[#0B0F19]/40 border-[#2D334A]/60 hover:border-slate-600'
                          }`}
                        >
                          {/* Field actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 hover:opacity-100 focus-within:opacity-100 group-hover:opacity-100 md:opacity-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                              disabled={index === 0}
                              className="p-1 hover:bg-[#2D334A] rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                              disabled={index === fields.length - 1}
                              className="p-1 hover:bg-[#2D334A] rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                              className="p-1 hover:bg-red-500/10 text-red-400 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Field content view */}
                          <div className="pr-16">
                            {field.type === 'divider' ? (
                              <div className="py-2"><hr className="border-t border-[#2D334A]/80 border-dashed" /></div>
                            ) : field.type === 'heading' ? (
                              <h4 className="text-base font-bold text-slate-100">{field.label || 'Heading Title'}</h4>
                            ) : field.type === 'paragraph' ? (
                              <p className="text-xs text-slate-400 whitespace-pre-wrap">{field.label || 'Paragraph context description...'}</p>
                            ) : field.type === 'imageBlock' ? (
                              <div className="w-full h-32 bg-[#0B0F19]/60 rounded-xl border border-[#2D334A]/80 flex items-center justify-center text-slate-500 text-xs font-bold gap-2">
                                <Image className="w-4 h-4" />
                                Custom Image block preview
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                                  {field.label || 'Untitled Field'}
                                  {field.required && <span className="text-red-500">*</span>}
                                </label>
                                
                                <div className="text-[11px] font-semibold text-slate-500 bg-[#0B0F19]/50 border border-[#2D334A]/60 px-3.5 py-2.5 rounded-xl cursor-default flex items-center justify-between">
                                  <span>{field.placeholder || 'Type here...'}</span>
                                  {field.helpText && <HelpCircle className="w-3.5 h-3.5 text-slate-600" />}
                                </div>
                                {field.helpText && <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">{field.helpText}</p>}
                                
                                {field.visibleIf?.fieldId && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded bg-violet-900/20 text-violet-400 border border-violet-500/20 text-[9px] font-black uppercase">
                                    <Sliders className="w-2.5 h-2.5" />
                                    Conditional Visibility Active
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
            ) : (
              /* FORM SETTINGS CARD */
              <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-6 md:p-8 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-base font-bold text-white">General Form Settings</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Control access, behaviors and security parameters</p>
                </div>
                
                <div className="space-y-5">
                  {/* Logo block */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logo/Header Image</label>
                    <div className="flex items-center gap-4">
                      {logoUrl && (
                        <div className="w-14 h-14 rounded-xl bg-white border border-[#2D334A] overflow-hidden flex items-center justify-center p-1">
                          <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center justify-center gap-2 border border-[#2D334A] hover:bg-[#1E243D] text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors w-full">
                          <Upload className="w-3.5 h-3.5" />
                          {logoUploading ? 'Uploading Logo...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {logoUrl && (
                          <button 
                            onClick={() => setLogoUrl('')}
                            className="text-[10px] text-red-400 font-bold mt-1.5 hover:underline cursor-pointer block"
                          >
                            Remove logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success message */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmation Message</label>
                    <input
                      type="text"
                      value={settings.successMessage}
                      onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
                      className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="e.g. Thanks for submitting!"
                    />
                  </div>

                  {/* Redirect URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redirect URL after submission</label>
                    <input
                      type="text"
                      value={settings.redirectUrl}
                      onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
                      className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                      placeholder="https://company.com/thank-you (Optional)"
                    />
                  </div>

                  {/* Submission limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission Limit</label>
                      <input
                        type="number"
                        value={settings.submissionLimit}
                        onChange={(e) => setSettings({ ...settings, submissionLimit: e.target.value })}
                        className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
                        placeholder="Unlimited"
                      />
                    </div>
                    
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="flex items-center gap-3 px-1 py-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={settings.allowMultiple}
                          onChange={(e) => setSettings({ ...settings, allowMultiple: e.target.checked })}
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                        />
                        Allow Multiple Submissions
                      </label>
                    </div>
                  </div>

                  {/* Start/End dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                      <input
                        type="datetime-local"
                        value={settings.startDate}
                        onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                        className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</label>
                      <input
                        type="datetime-local"
                        value={settings.endDate}
                        onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                        className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Security options */}
                  <div className="space-y-3 pt-3 border-t border-[#2D334A]/60">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Security & Data Collection</div>
                    
                    <label className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.enableCaptcha}
                        onChange={(e) => setSettings({ ...settings, enableCaptcha: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                      />
                      Enable Bot Verification (Math CAPTCHA)
                    </label>

                    <label className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.collectIp}
                        onChange={(e) => setSettings({ ...settings, collectIp: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                      />
                      Collect Submitter's IP Address
                    </label>

                    <label className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.collectTimestamp}
                        onChange={(e) => setSettings({ ...settings, collectTimestamp: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                      />
                      Record Detailed Submission Timestamps
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Field Configurations (4 cols) */}
          <div className="lg:col-span-4 bg-[#131726]/60 backdrop-blur-md p-5 rounded-3xl border border-[#2D334A]/50 shadow-md min-h-[500px]">
            <div>
              <h3 className="text-sm font-bold text-white">Properties Config</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Select a field on the canvas to configure properties</p>
            </div>

            {activeField ? (
              <div className="mt-6 space-y-6 animate-in fade-in duration-200">
                <div className="p-3 bg-[#0B0F19]/40 border border-[#2D334A]/50 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-black text-violet-400 capitalize bg-violet-500/10 px-2.5 py-1 rounded-lg">
                    {activeField.type}
                  </span>
                  <button 
                    onClick={() => removeField(activeField.id)}
                    className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    title="Remove field"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Properties fields */}
                <div className="space-y-4">
                  
                  {/* Label config */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Label</label>
                    <input
                      type="text"
                      value={activeField.label}
                      onChange={(e) => updateFieldProperty(activeField.id, 'label', e.target.value)}
                      className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-semibold"
                      placeholder="e.g. Enter full name"
                    />
                  </div>

                  {/* Placeholder */}
                  {!['divider', 'heading', 'paragraph', 'imageBlock', 'date', 'time', 'rating', 'toggle', 'signature'].includes(activeField.type) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Placeholder</label>
                      <input
                        type="text"
                        value={activeField.placeholder}
                        onChange={(e) => updateFieldProperty(activeField.id, 'placeholder', e.target.value)}
                        className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-semibold"
                        placeholder="Helpful prompt text"
                      />
                    </div>
                  )}

                  {/* Help text */}
                  {!['divider', 'imageBlock'].includes(activeField.type) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Help / Guidance text</label>
                      <input
                        type="text"
                        value={activeField.helpText}
                        onChange={(e) => updateFieldProperty(activeField.id, 'helpText', e.target.value)}
                        className="w-full rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-semibold"
                        placeholder="Sub-text displayed beneath input"
                      />
                    </div>
                  )}

                  {/* Validation Rules */}
                  {!['divider', 'heading', 'paragraph', 'imageBlock'].includes(activeField.type) && (
                    <div className="space-y-3 pt-3 border-t border-[#2D334A]/40">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Validation Rules</div>
                      
                      {/* Required */}
                      <label className="flex items-center gap-3 text-slate-300 font-bold text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeField.required}
                          onChange={(e) => updateFieldProperty(activeField.id, 'required', e.target.checked)}
                          className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 border-[#2D334A] bg-[#0B0F19]"
                        />
                        Required (Submitter must fill)
                      </label>

                      {/* Text inputs min/max length */}
                      {['shortText', 'longText'].includes(activeField.type) && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Min Length</label>
                            <input
                              type="number"
                              value={activeField.validation?.minLength || ''}
                              onChange={(e) => updateFieldValidation(activeField.id, 'minLength', e.target.value)}
                              className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max Length</label>
                            <input
                              type="number"
                              value={activeField.validation?.maxLength || ''}
                              onChange={(e) => updateFieldValidation(activeField.id, 'maxLength', e.target.value)}
                              className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* File limits */}
                      {['fileUpload', 'imageUpload'].includes(activeField.type) && (
                        <div className="space-y-1 mt-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Max File Size (MB)</label>
                          <input
                            type="number"
                            value={activeField.validation?.maxFileSize || 5}
                            onChange={(e) => updateFieldValidation(activeField.id, 'maxFileSize', e.target.value)}
                            className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                            placeholder="5"
                          />
                        </div>
                      )}

                      {/* Rating scale limit */}
                      {activeField.type === 'rating' && (
                        <div className="space-y-1 mt-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rating Scale Limit</label>
                          <select
                            value={activeField.validation?.ratingMax || 5}
                            onChange={(e) => updateFieldValidation(activeField.id, 'ratingMax', parseInt(e.target.value))}
                            className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                          >
                            <option value="5">1 to 5 Stars</option>
                            <option value="10">1 to 10 Stars</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Choices List */}
                  {['dropdown', 'radio', 'checkbox', 'multiSelect'].includes(activeField.type) && (
                    <div className="space-y-2 pt-3 border-t border-[#2D334A]/40">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selection Choices</label>
                        <button
                          type="button"
                          onClick={() => handleAddFieldOption(activeField.id)}
                          className="text-[10px] font-black text-violet-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Add Option
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {activeField.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateFieldOption(activeField.id, oIdx, e.target.value)}
                              className="flex-1 rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500 transition-all font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveFieldOption(activeField.id, oIdx)}
                              className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditional Visibility UI */}
                  {!['divider'].includes(activeField.type) && (
                    <div className="space-y-3 pt-3 border-t border-[#2D334A]/40">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Conditional Visibility</div>
                      
                      <div className="p-3 bg-[#0B0F19]/40 border border-[#2D334A]/40 rounded-2xl space-y-2">
                        <div className="text-[10px] font-bold text-slate-300">IF Question block:</div>
                        <select
                          value={activeField.visibleIf?.fieldId || ''}
                          onChange={(e) => {
                            updateFieldVisibleIf(activeField.id, 'fieldId', e.target.value);
                            updateFieldVisibleIf(activeField.id, 'value', '');
                          }}
                          className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          <option value="">Always Visible (None)</option>
                          {eligibleConditionFields.map(f => (
                            <option key={f.id} value={f.id}>{f.label || f.id}</option>
                          ))}
                        </select>

                        {activeField.visibleIf?.fieldId && (
                          <>
                            <div className="text-[10px] font-bold text-slate-300 mt-2">EQUALS value:</div>
                            
                            {(() => {
                              const targetField = fields.find(f => f.id === activeField.visibleIf.fieldId);
                              if (targetField?.options && targetField.options.length > 0) {
                                return (
                                  <select
                                    value={activeField.visibleIf?.value || ''}
                                    onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                    className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                                  >
                                    <option value="">Select option...</option>
                                    {targetField.options.map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                );
                              } else if (targetField?.type === 'toggle') {
                                return (
                                  <select
                                    value={activeField.visibleIf?.value || ''}
                                    onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                    className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
                                  >
                                    <option value="">Select value...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                  </select>
                                );
                              } else {
                                return (
                                  <input
                                    type="text"
                                    value={activeField.visibleIf?.value || ''}
                                    onChange={(e) => updateFieldVisibleIf(activeField.id, 'value', e.target.value)}
                                    className="w-full rounded-lg border border-[#2D334A]/50 bg-[#0B0F19]/50 p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                                    placeholder="Value condition"
                                  />
                                );
                              }
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center">
                <Sliders className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
                <p className="text-xs font-bold">No active field selected</p>
                <p className="text-[10px] text-slate-500 mt-1">Select a field on the canvas to configure properties</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderEditor;
