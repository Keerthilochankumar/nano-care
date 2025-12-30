'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Activity, Stethoscope, Shield, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ICU Decision Support</h1>
                <p className="text-sm text-gray-500">Clinical Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4 p-4 bg-white rounded-full shadow-lg">
              <Activity className="h-12 w-12 text-blue-600" />
              <Stethoscope className="h-12 w-12 text-green-600" />
              <Heart className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered ICU
            <span className="text-blue-600"> Decision Support</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Advanced clinical decision-support system designed specifically for ICU environments. 
            Integrate patient data, real-time vitals, and clinical documentation to enhance patient care.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/sign-up">
              <Button size="lg" className="px-8 py-3">
                Start Clinical Session
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Activity className="h-12 w-12 text-blue-600" />
              </div>
              <CardTitle>Real-Time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Continuous integration with ICU monitors for live vital signs, alarms, and trending data.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Stethoscope className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle>Clinical Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI-powered analysis of patient data, lab results, imaging, and clinical notes for decision support.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle>Safety First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built with clinical safety protocols, red flag detection, and compliance with healthcare standards.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Comprehensive ICU Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Users className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Patient-Centered Care</h3>
                  <p className="text-gray-600">
                    Individual patient profiles with complete medical history, current medications, and care team information.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Trend Analysis</h3>
                  <p className="text-gray-600">
                    Advanced analytics for vital sign trends, medication responses, and clinical progression.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Heart className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Critical Care Focus</h3>
                  <p className="text-gray-600">
                    Specialized for intensive care environments with ventilator management and hemodynamic monitoring.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Clinical Safety</h3>
                  <p className="text-gray-600">
                    Built-in safety checks, drug interaction warnings, and protocol compliance monitoring.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Activity className="h-6 w-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Real-Time Alerts</h3>
                  <p className="text-gray-600">
                    Immediate notifications for critical changes in patient status and vital sign abnormalities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Stethoscope className="h-6 w-6 text-teal-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Evidence-Based</h3>
                  <p className="text-gray-600">
                    Recommendations based on current clinical guidelines and best practices in critical care.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform ICU Care?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join healthcare professionals using AI-powered decision support for better patient outcomes.
          </p>
          <Link href="/sign-up">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Start Your Clinical Session
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-lg font-semibold">ICU Decision Support</span>
            </div>
            <p className="text-gray-400">
              Advanced clinical decision-support for intensive care environments
            </p>
            <p className="text-gray-500 text-sm mt-4">
              For use by licensed healthcare professionals only. Not a substitute for clinical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}