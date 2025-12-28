"use client";

import { useState } from "react";
import { trpc } from "@/client/trpc";
import { Modal } from "@/components/ui/Modal";
import { 
  Award, X, TrendingUp, Users, CheckCircle, XCircle, 
  Trophy, Target, Zap, ChevronRight, Info
} from "lucide-react";

interface LeadershipPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadershipPoolModal({ isOpen, onClose }: LeadershipPoolModalProps) {
  const { data: qualificationStatus, isLoading } = trpc.leadershipPool.getQualificationStatus.useQuery();
  const { data: progressDetails } = trpc.leadershipPool.getProgressDetails.useQuery();
  const { data: referralTree } = trpc.leadershipPool.getReferralTree.useQuery();
  const checkQualificationMutation = trpc.leadershipPool.checkQualification.useMutation();

  const handleCheckQualification = async () => {
    try {
      await checkQualificationMutation.mutateAsync();
      alert("Qualification checked! Your status has been updated.");
    } catch (error: any) {
      alert(error.message || "Failed to check qualification");
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-gray-300";
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 75) return "text-emerald-600";
    if (progress >= 50) return "text-yellow-600";
    if (progress >= 25) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Leadership Pool Challenge</h2>
              <p className="text-yellow-100 text-sm">
                Qualify for exclusive rewards and recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading qualification status...</div>
          ) : (
            <div className="space-y-6">
              {/* Current Status Card */}
              <div className={`border-2 rounded-xl p-6 ${
                qualificationStatus?.isQualified
                  ? "border-green-500 bg-green-50"
                  : "border-yellow-500 bg-yellow-50"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {qualificationStatus?.isQualified ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <Target className="w-8 h-8 text-yellow-600" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {qualificationStatus?.isQualified ? "Qualified!" : "In Progress"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {qualificationStatus?.isQualified 
                          ? `Qualified via ${qualificationStatus.qualificationMethod === "OPTION_1" ? "Option 1" : "Option 2"}`
                          : "Keep building your team to qualify"
                        }
                      </p>
                    </div>
                  </div>
                  {qualificationStatus?.isQualified && qualificationStatus.qualifiedAt && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Qualified On</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(qualificationStatus.qualifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {qualificationStatus?.isQualified && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Trophy className="w-5 h-5" />
                      <span className="font-semibold">Tier: {qualificationStatus.tier}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You now have access to exclusive Leadership Pool rewards and benefits!
                    </p>
                  </div>
                )}
              </div>

              {/* Qualification Options */}
              {progressDetails && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Option 1 */}
                  <div className="border border-gray-200 rounded-xl p-5 hover:border-yellow-400 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Users className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Option 1</h4>
                        <p className="text-xs text-gray-500">Total Volume Approach</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-bold ${getProgressTextColor(progressDetails.option1.percentage)}`}>
                          {progressDetails.option1.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progressDetails.option1.percentage)}`}
                          style={{ width: `${Math.min(progressDetails.option1.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {qualificationStatus?.hasRegularPlus ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Regular Plus Package
                          </p>
                          <p className="text-xs text-gray-500">
                            {qualificationStatus?.hasRegularPlus ? "Active" : "Required"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {progressDetails.option1.currentRegularPlus >= 70 ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            Sponsor 70 Regular Plus Members
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-yellow-500 h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min((progressDetails.option1.currentRegularPlus / 70) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                              {progressDetails.option1.currentRegularPlus} / 70
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {progressDetails.option1.percentage >= 100 && (
                      <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          Option 1 Complete!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Option 2 */}
                  <div className="border border-gray-200 rounded-xl p-5 hover:border-yellow-400 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">Option 2</h4>
                        <p className="text-xs text-gray-500">Generational Approach</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className={`font-bold ${getProgressTextColor(progressDetails.option2.percentage)}`}>
                          {progressDetails.option2.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progressDetails.option2.percentage)}`}
                          style={{ width: `${Math.min(progressDetails.option2.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {qualificationStatus?.hasRegularPlus ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Regular Plus Package
                          </p>
                          <p className="text-xs text-gray-500">
                            {qualificationStatus?.hasRegularPlus ? "Active" : "Required"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {progressDetails.option2.currentFirstGen >= 50 ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            50 First Generation
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min((progressDetails.option2.currentFirstGen / 50) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                              {progressDetails.option2.currentFirstGen} / 50
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {progressDetails.option2.currentSecondGen >= 50 ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            50 Second Generation
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min((progressDetails.option2.currentSecondGen / 50) * 100, 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                              {progressDetails.option2.currentSecondGen} / 50
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {progressDetails.option2.percentage >= 100 && (
                      <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">
                          Option 2 Complete!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {progressDetails?.recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Recommendation</h4>
                      <p className="text-sm text-blue-800">{progressDetails.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Tree Visualization */}
              {referralTree && referralTree.length > 0 && (
                <div className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Your Regular Plus Referral Tree
                  </h3>
                  <div className="space-y-3">
                    {referralTree.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          member.generation === 1 ? "bg-yellow-500" : "bg-amber-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {member.name || `User ${member.id.slice(0, 8)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Generation {member.generation} • Joined {new Date(member.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.generation === 1
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          Gen {member.generation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Check Qualification Button */}
              {!qualificationStatus?.isQualified && (
                <button
                  onClick={handleCheckQualification}
                  disabled={checkQualificationMutation.isPending}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checkQualificationMutation.isPending ? (
                    "Checking..."
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Check My Qualification
                    </>
                  )}
                </button>
              )}

              {/* Benefits Preview */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Leadership Pool Benefits
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>Monthly pool distribution from global sales</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>Exclusive leadership training and mentorship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>Recognition at company events and ceremonies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>Priority customer support and concierge services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                    <span>Access to premium promotional materials</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
