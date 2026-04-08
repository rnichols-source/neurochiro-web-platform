"use client";

import { FileText, ShieldAlert, CheckCircle2, MessageSquare, Search, ShieldCheck, AlertTriangle, Clock, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getContractsAction, analyzeContractAction } from "./actions";

function ClauseCard({ clause }: { clause: any }) {
  const risk = clause.risk || clause.status || "Medium";
  const isLow = risk === "Low" || risk === "safe";
  const isHigh = risk === "High" || risk === "Critical" || risk === "danger";
  const colors = isLow ? "bg-green-50/50 border-green-100" : isHigh ? "bg-red-50/50 border-red-100" : "bg-orange-50/50 border-orange-100";
  const badgeColors = isLow ? "bg-green-100 text-green-600" : isHigh ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600";
  const Icon = isLow ? ShieldCheck : isHigh ? ShieldAlert : AlertTriangle;
  const iconColor = isLow ? "text-green-500" : isHigh ? "text-red-500" : "text-orange-500";

  return (
    <div className={`p-5 rounded-2xl border ${colors}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-neuro-navy text-sm">{clause.name || clause.type}</h4>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColors}`}>{risk}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{clause.finding || clause.text}</p>
          {(clause.insight || clause.recommendation) && (
            <div className="flex gap-2 mt-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Recommendation</span>
                <p className="text-sm text-gray-600">{clause.recommendation || clause.insight}</p>
              </div>
            </div>
          )}
          {clause.negotiation && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
              <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-0.5">Negotiation Strategy</span>
                <p className="text-sm text-gray-700 font-medium">{clause.negotiation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractLabPage() {
  const [contractText, setContractText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [pastContracts, setPastContracts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    getContractsAction().then(setPastContracts).catch(console.error).finally(() => setLoadingHistory(false));
  }, []);

  const handleAnalyze = async () => {
    if (!contractText.trim() || contractText.trim().length < 100) {
      setAnalysisError("Please paste at least 100 characters of contract text.");
      return;
    }
    setIsUploading(true);
    setAnalysisError(null);
    try {
      const result = await analyzeContractAction(contractText);
      if (result.error) setAnalysisError(result.error);
      else if (result.analysis) {
        setAnalysisResult(result.analysis);
        setPastContracts(await getContractsAction());
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed.");
    }
    setIsUploading(false);
  };

  const recColor = analysisResult?.overallRecommendation === "Accept" ? "text-green-500" : analysisResult?.overallRecommendation === "Walk Away" ? "text-red-500" : "text-orange-500";

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-heading font-black text-neuro-navy">Contract Lab</h1>
        <p className="text-gray-500 mt-2">Paste your employment contract below and let AI analyze each clause for risks and negotiation opportunities.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {/* Input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[360px]">
            <h2 className="text-lg font-bold text-neuro-navy mb-1">Analyze a Contract</h2>
            <p className="text-sm text-gray-400 mb-4">Paste the full text of your contract.</p>
            {!analysisResult ? (
              <div className="flex-1 flex flex-col gap-4">
                <textarea value={contractText} onChange={(e) => setContractText(e.target.value)} placeholder="Paste your employment contract text here..." className="flex-1 p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-neuro-orange focus:border-neuro-orange text-sm min-h-[180px]" />
                {analysisError && <p className="text-red-500 text-xs font-bold">{analysisError}</p>}
                <button onClick={handleAnalyze} disabled={isUploading || !contractText.trim()} className="w-full py-3 px-6 bg-neuro-navy text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-neuro-navy/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><ShieldAlert className="w-4 h-4" /> Analyze Contract</>}
                </button>
              </div>
            ) : (
              <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <h3 className="font-bold text-green-900 mb-1">Analysis Complete</h3>
                <button onClick={() => { setAnalysisResult(null); setContractText(""); }} className="mt-4 text-xs font-bold uppercase tracking-widest text-neuro-navy hover:underline">Analyze Another</button>
              </div>
            )}
          </div>

          {/* Past Analyses */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-neuro-navy uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neuro-orange" /> Past Analyses
            </h3>
            <div className="space-y-2">
              {loadingHistory ? (
                <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-gray-300 animate-spin mx-auto mb-2" /><p className="text-xs text-gray-400">Loading...</p></div>
              ) : pastContracts.length > 0 ? pastContracts.map((c) => (
                <button key={c.id} onClick={() => setAnalysisResult(c.analysis_results)} className="w-full text-left p-3 rounded-xl border border-gray-50 hover:border-neuro-orange hover:bg-gray-50 transition-all flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neuro-navy truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-orange-500 ml-3">{c.analysis_results?.overallScore || c.analysis_results?.overallGrade || "N/A"}</span>
                </button>
              )) : (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No analyses yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8">
          {analysisResult ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-bold text-neuro-navy mb-1">Analysis Results</h2>
                  {analysisResult.summary && <p className="text-gray-500 text-sm">{analysisResult.summary}</p>}
                </div>
                <div className="text-center shrink-0 ml-6">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Score</span>
                  <span className="text-4xl font-black text-orange-500">{analysisResult.overallScore || analysisResult.overallGrade || "N/A"}</span>
                  {analysisResult.overallRecommendation && <span className={`block text-xs font-bold uppercase tracking-widest mt-1 ${recColor}`}>{analysisResult.overallRecommendation}</span>}
                </div>
              </div>
              <div className="space-y-4">
                {(analysisResult.clauses || []).map((clause: any, i: number) => <ClauseCard key={i} clause={clause} />)}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-1">No Analysis Yet</h3>
              <p className="text-gray-400 text-sm max-w-md">Paste a contract on the left and click Analyze to see a clause-by-clause breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
