/**
 * Página de Estadísticas
 * 
 * Esta página muestra estadísticas detalladas de la aplicación.
 * Incluye:
 * - Gráficos de actividad
 * - Métricas clave
 * - Tendencias y análisis
 */

import { useState } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { FaUsers, FaVideo, FaComments, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

export default function AdminEstadisticas() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-8">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Estadísticas
            </h1>
            <p className="text-gray-400 mt-2">Análisis y métricas de la plataforma</p>
          </div>

          {/* Selector de período */}
          <div className="bg-gray-900 rounded-lg p-4 mb-8 border border-gray-800">
            <div className="flex items-center space-x-4">
              <FaCalendarAlt className="text-gray-400" />
              <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                Hoy
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Esta semana
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Este mes
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Este año
              </button>
            </div>
          </div>

          {/* Tarjetas de métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Usuarios activos */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Usuarios Activos</p>
                  <p className="text-2xl font-bold mt-1">1,234</p>
                  <p className="text-green-500 text-sm mt-1">↑ 12% desde ayer</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <FaUsers className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Videollamadas */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-purple-500 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Videollamadas</p>
                  <p className="text-2xl font-bold mt-1">456</p>
                  <p className="text-green-500 text-sm mt-1">↑ 8% desde ayer</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-full">
                  <FaVideo className="text-purple-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-green-500 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Mensajes</p>
                  <p className="text-2xl font-bold mt-1">8,765</p>
                  <p className="text-red-500 text-sm mt-1">↓ 3% desde ayer</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-full">
                  <FaComments className="text-green-500 text-xl" />
                </div>
              </div>
            </div>

            {/* Tiempo promedio */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-yellow-500 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tiempo Promedio</p>
                  <p className="text-2xl font-bold mt-1">24m</p>
                  <p className="text-green-500 text-sm mt-1">↑ 5% desde ayer</p>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-full">
                  <FaChartLine className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y análisis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de actividad */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Actividad por Hora</h2>
              <div className="h-64 flex items-center justify-center text-gray-400">
                [Aquí irá el gráfico de actividad]
              </div>
            </div>

            {/* Distribución de usuarios */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Distribución de Usuarios</h2>
              <div className="h-64 flex items-center justify-center text-gray-400">
                [Aquí irá el gráfico de distribución]
              </div>
            </div>

            {/* Tendencias */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Tendencias</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Videollamadas grupales</span>
                  <span className="text-green-500">↑ 25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Mensajes directos</span>
                  <span className="text-green-500">↑ 15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Publicaciones</span>
                  <span className="text-red-500">↓ 5%</span>
                </div>
              </div>
            </div>

            {/* Métricas adicionales */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Métricas Adicionales</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Tasa de retención</span>
                  <span className="text-green-500">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Usuarios nuevos</span>
                  <span className="text-green-500">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Tiempo promedio de sesión</span>
                  <span className="text-green-500">32m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 