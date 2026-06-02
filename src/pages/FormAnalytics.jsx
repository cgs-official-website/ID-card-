import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, BarChart2, Eye, RefreshCw, CheckCircle, PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import { 
  fetchFormDetails, fetchFormFields, fetchFormResponses 
} from '../utils/dbHelper';

const FormAnalytics = () => {
  const { id: formId } = useParams();

  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active choice field to chart distribution
  const [selectedChoiceFieldId, setSelectedChoiceFieldId] = useState('');

  // Daily submissions data (grouped by date)
  const [timelineData, setTimelineData] = useState([]);
  // Distribution of options for active choice field
  const [choiceDistribution, setChoiceDistribution] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [formId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch form
      const formData = await fetchFormDetails(formId);
      if (!formData) return;
      setForm(formData);

      // Fetch fields
      const fetchedFields = await fetchFormFields(formId);
      setFields(fetchedFields);

      // Fetch responses
      const resList = await fetchFormResponses(formId);
      setResponses(resList);

      // Calculate daily trends (last 10 days)
      processTimelineData(resList);

      // Set default choice field for bar/pie charts
      const choiceField = fetchedFields.find(f => 
        ['radio', 'dropdown', 'checkbox', 'toggle', 'rating'].includes(f.type)
      );
      if (choiceField) {
        setSelectedChoiceFieldId(choiceField.id);
        processChoiceDistribution(resList, choiceField);
      }

    } catch (err) {
      console.error("Error fetching analytics details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChoiceFieldId && responses.length > 0) {
      const field = fields.find(f => f.id === selectedChoiceFieldId);
      if (field) {
        processChoiceDistribution(responses, field);
      }
    }
  }, [selectedChoiceFieldId]);

  // Group responses by last 10 days
  const processTimelineData = (resList) => {
    const datesMap = {};
    // Seed last 10 days
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      datesMap[str] = 0;
    }

    resList.forEach(res => {
      if (!res.dateObj) return;
      const str = res.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (datesMap[str] !== undefined) {
        datesMap[str]++;
      }
    });

    const formatted = Object.keys(datesMap).map(date => ({
      date,
      count: datesMap[date]
    }));
    setTimelineData(formatted);
  };

  // Process choice distributions (e.g. checkbox selections, rating scores, radio options)
  const processChoiceDistribution = (resList, field) => {
    let options = [];
    if (field.type === 'toggle') {
      options = ['yes', 'no'];
    } else if (field.type === 'rating') {
      const max = field.validation?.ratingMax || 5;
      options = Array.from({ length: max }, (_, i) => String(i + 1));
    } else {
      options = field.options || [];
    }

    const counts = {};
    options.forEach(opt => { counts[opt] = 0; });

    resList.forEach(res => {
      const val = res.responseData?.[field.id];
      if (val === undefined || val === null) return;

      if (Array.isArray(val)) {
        // e.g. checkbox arrays
        val.forEach(item => {
          if (counts[String(item)] !== undefined) {
            counts[String(item)]++;
          }
        });
      } else {
        if (counts[String(val)] !== undefined) {
          counts[String(val)]++;
        }
      }
    });

    const distribution = options.map(opt => ({
      name: opt,
      count: counts[opt]
    }));
    setChoiceDistribution(distribution);
  };

  // Metric computations
  const totalViews = form?.views || 0;
  const totalSubmissions = responses.length;
  const conversionRate = totalViews > 0 
    ? ((totalSubmissions / totalViews) * 100).toFixed(1) 
    : '0.0';

  // SVG Line Chart computations
  const maxTimelineCount = Math.max(...timelineData.map(d => d.count), 5);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 35;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingRight = 15;

  const points = timelineData.map((d, i) => {
    const x = paddingLeft + (i * (chartWidth - paddingLeft - paddingRight) / (timelineData.length - 1));
    const y = chartHeight - paddingBottom - (d.count * (chartHeight - paddingTop - paddingBottom) / maxTimelineCount);
    return { x, y, label: d.date, count: d.count };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Area path enclosing below the line for glowing fill
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`
    : '';

  // SVG Donut Chart computations
  const donutTotal = choiceDistribution.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedAngle = 0;
  const r = 50;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;

  const choiceColors = [
    'stroke-violet-500', 'stroke-blue-500', 'stroke-emerald-500', 
    'stroke-amber-500', 'stroke-rose-500', 'stroke-pink-500', 'stroke-indigo-500'
  ];

  const eligibleFields = fields.filter(f => 
    ['radio', 'dropdown', 'checkbox', 'toggle', 'rating'].includes(f.type)
  );

  return (
    <div className="space-y-8 bg-transparent">
      
      {/* Header bar */}
      <div className="flex items-center gap-3 bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-lg">
        <Link to="/form-builder" className="p-2 hover:bg-[#1E243D] text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">{form?.title || 'Form Analytics'}</h2>
          <p className="text-slate-400 text-sm font-medium">Visual submission metrics and field distributions</p>
        </div>
      </div>

      {/* Analytics Counter metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Views Card */}
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Total Form Views</p>
            <h3 className="text-4xl font-black text-white">{totalViews}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 text-blue-400">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Total Submissions Card */}
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Submissions</p>
            <h3 className="text-4xl font-black text-white">{totalSubmissions}</h3>
          </div>
          <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20 text-violet-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion Rate Card with SVG circular visual */}
        <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Conversion Rate</p>
            <h3 className="text-4xl font-black text-white">{conversionRate}%</h3>
          </div>
          
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-[#2D334A]/40"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className="stroke-violet-500 transition-all duration-1000"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * Math.min(parseFloat(conversionRate), 100)) / 100}
              />
            </svg>
            <div className="absolute text-[10px] font-black text-violet-400">%</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#131726]/80 border border-[#2D334A]/50 rounded-3xl p-16 text-center text-white">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
          <span className="font-semibold text-sm">Analyzing submissions...</span>
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-[#131726]/80 border border-[#2D334A]/50 rounded-3xl p-16 text-center text-slate-400 shadow-md">
          <BarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-white text-base">No responses recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Analytics will be generated automatically once users submit answers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DAILY SUBMISSION TREND LINE GRAPH (7 cols) */}
          <div className="lg:col-span-7 bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <LineIcon className="w-5 h-5 text-violet-400" />
              <div>
                <h4 className="text-base font-bold text-white">Daily Submissions</h4>
                <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Submission volumes over last 10 days</p>
              </div>
            </div>

            {/* Render Custom SVG line graph */}
            <div className="w-full">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>

                {/* Y-axis gridlines */}
                {Array.from({ length: 4 }).map((_, idx) => {
                  const yVal = paddingTop + (idx * (chartHeight - paddingTop - paddingBottom) / 3);
                  const countLabel = Math.round(maxTimelineCount - (idx * maxTimelineCount / 3));
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingLeft} 
                        y1={yVal} 
                        x2={chartWidth - paddingRight} 
                        y2={yVal} 
                        className="stroke-[#2D334A]/20" 
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={paddingLeft - 8} 
                        y={yVal + 3} 
                        textAnchor="end" 
                        className="fill-slate-500 text-[8px] font-mono font-bold"
                      >
                        {countLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Filled Area Gradient */}
                {areaD && (
                  <path d={areaD} fill="url(#areaGrad)" />
                )}

                {/* Main line path */}
                {pathD && (
                  <path 
                    d={pathD} 
                    fill="none" 
                    stroke="url(#lineGrad)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                )}

                {/* Point dots */}
                {points.map((p, idx) => (
                  <g key={idx} className="group/dot">
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="4" 
                      className="fill-violet-400 stroke-[#131726]" 
                      strokeWidth="2"
                    />
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="9" 
                      className="fill-violet-500/0 hover:fill-violet-500/10 cursor-pointer"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      className="fill-white text-[9px] font-black font-mono bg-[#0B0F19] hidden group-hover/dot:block"
                    >
                      {p.count}
                    </text>
                  </g>
                ))}

                {/* X Axis Labels */}
                {points.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className="fill-slate-500 text-[8px] font-bold"
                  >
                    {p.label}
                  </text>
                ))}

                {/* Solid base axis line */}
                <line 
                  x1={paddingLeft} 
                  y1={chartHeight - paddingBottom} 
                  x2={chartWidth - paddingRight} 
                  y2={chartHeight - paddingBottom} 
                  className="stroke-[#2D334A]/50" 
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>

          {/* CHOICE SPLIT PIE/DONUT & BAR CHART (5 cols) */}
          <div className="lg:col-span-5 bg-[#131726]/80 backdrop-blur-md rounded-3xl border border-[#2D334A]/50 p-6 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-violet-400" />
                  <div>
                    <h4 className="text-base font-bold text-white">Choice Analysis</h4>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5 font-sans">Option frequency splits</p>
                  </div>
                </div>
                
                {/* Selector for choice fields */}
                {eligibleFields.length > 0 && (
                  <select
                    value={selectedChoiceFieldId}
                    onChange={(e) => setSelectedChoiceFieldId(e.target.value)}
                    className="rounded-xl border border-[#2D334A]/50 bg-[#0B0F19]/50 px-3.5 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-violet-500 max-w-[150px] cursor-pointer"
                  >
                    {eligibleFields.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedChoiceFieldId ? (
                donutTotal === 0 ? (
                  <div className="text-center py-12 text-xs font-bold text-slate-500 bg-[#0B0F19]/20 border border-dashed border-[#2D334A]/60 rounded-2xl">
                    No answer data provided for this field
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    
                    {/* SVG Donut Visual */}
                    <div className="relative w-40 h-40 mx-auto">
                      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                        {choiceDistribution.map((item, idx) => {
                          if (item.count === 0) return null;
                          const segmentPercent = item.count / donutTotal;
                          const dashArrayStr = `${segmentPercent * circumference} ${circumference}`;
                          const dashOffsetStr = `-${accumulatedAngle * circumference}`;
                          
                          accumulatedAngle += segmentPercent;

                          return (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r={r}
                              className={`fill-transparent stroke-20 transition-all ${choiceColors[idx % choiceColors.length]}`}
                              strokeDasharray={dashArrayStr}
                              strokeDashoffset={dashOffsetStr}
                              strokeLinecap="round"
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Responses</span>
                        <span className="text-2xl font-black text-white">{donutTotal}</span>
                      </div>
                    </div>

                    {/* Donut Legend lists with color indicators */}
                    <div className="space-y-2.5">
                      {choiceDistribution.map((item, idx) => {
                        if (item.count === 0) return null;
                        const percent = ((item.count / donutTotal) * 100).toFixed(0);
                        const cleanColor = choiceColors[idx % choiceColors.length]
                          .replace('stroke-', 'bg-');

                        return (
                          <div key={idx} className="flex items-center justify-between text-xs font-semibold gap-2.5">
                            <div className="flex items-center gap-2 truncate">
                              <div className={`w-3 h-3 rounded-md shrink-0 ${cleanColor}`} />
                              <span className="text-slate-300 font-bold capitalize truncate max-w-[100px]">{item.name}</span>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="text-slate-200 font-black">{item.count}</span>
                              <span className="text-slate-500 font-bold ml-1.5">{percent}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )
              ) : (
                <div className="text-center py-12 text-xs font-bold text-slate-500 bg-[#0B0F19]/20 border border-dashed border-[#2D334A]/60 rounded-2xl">
                  No checkbox/multiple choice questions found in this form
                </div>
              )}
            </div>

            {/* Horizontal Bar Chart listing for choice options */}
            {selectedChoiceFieldId && donutTotal > 0 && (
              <div className="space-y-3 pt-5 border-t border-[#2D334A]/40 mt-4">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bar Distribution</div>
                <div className="space-y-2.5">
                  {choiceDistribution.map((item, idx) => {
                    const ratio = donutTotal > 0 ? (item.count / donutTotal) * 100 : 0;
                    const fillGrad = choiceColors[idx % choiceColors.length]
                      .replace('stroke-', 'from-') + ' to-violet-600';
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-300">
                          <span className="capitalize">{item.name}</span>
                          <span>{item.count} ({ratio.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-[#2D334A]/60">
                          <div 
                            className={`h-full bg-gradient-to-r ${fillGrad} rounded-full transition-all duration-1000`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default FormAnalytics;
