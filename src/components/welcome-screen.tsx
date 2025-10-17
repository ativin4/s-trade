'use client'

import { useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Smartphone, 
  BarChart3, 
  Zap,
  ArrowRight,
  Github,
  Chrome
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface WelcomeScreenProps {
  providers?: Record<string, any>
}

export function WelcomeScreen({ providers }: WelcomeScreenProps) {
  const [isSigningIn, setIsSigningIn] = useState<string | null>(null)

  const handleSignIn = async (providerId: string) => {
    setIsSigningIn(providerId)
    try {
      await signIn(providerId, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsSigningIn(null)
    }
  }

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI algorithms analyze market trends and provide intelligent trading recommendations'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Multi-Broker Integration',
      description: 'Connect with 5paisa, Zerodha, and Groww for unified portfolio management'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Risk Management',
      description: 'Built-in risk controls and automated stop-loss mechanisms to protect your capital'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Progressive Web App',
      description: 'Works offline and installs like a native app on any device'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real-time Analytics',
      description: 'Live market data and portfolio performance tracking with detailed insights'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Automated Trading',
      description: 'Set up swing trading automation based on AI recommendations'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">AI-Powered Trading Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                  S-Trade
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                The future of stock trading is here. Harness the power of AI for intelligent 
                investment decisions and automated swing trading across multiple brokers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              {providers && Object.values(providers).map((provider) => (
                <Button
                  key={provider.name}
                  size="lg"
                  onClick={() => handleSignIn(provider.id)}
                  disabled={isSigningIn === provider.id}
                  className={`${provider.id === 'google' ? 'bg-white text-gray-900 hover:bg-gray-100' : 'border-gray-600 text-white hover:bg-gray-800'} font-semibold px-8 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl`}
                  variant={provider.id === 'google' ? 'default' : 'outline'}
                >
                  {isSigningIn === provider.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {provider.id === 'google' && <Chrome className="w-5 h-5" />}
                      {provider.id === 'github' && <Github className="w-5 h-5" />}
                      Continue with {provider.name}
                      {provider.id === 'google' && <ArrowRight className="w-4 h-4" />}
                    </div>
                  )}
                </Button>
              ))}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>SEBI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Real-time Data</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose S-Trade?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Built for modern traders who want to leverage technology for smarter investment decisions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Supported Brokers Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">Trusted by Leading Brokers</h3>
          <div className="flex justify-center items-center gap-12">
            <img src="/5paisa.svg" alt="5paisa" className="h-8" />
            <img src="/zerodha.svg" alt="Zerodha" className="h-8" />
            <img src="/groww.svg" alt="Groww" className="h-8" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
