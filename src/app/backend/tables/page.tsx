"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";

export default function TablesPage() {
  const {
    floors,
    tables,
    createFloor,
    createTable,
    toggleTableStatus
  } = useApp();

  // Floor & Table states
  const [newFloorName, setNewFloorName] = useState("");
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableFloorId, setTableFloorId] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [tableSeats, setTableSeats] = useState("4");

  // Select default floor on load/change
  useEffect(() => {
    if (floors.length > 0 && !tableFloorId) {
      setTableFloorId(String(floors[0].id));
    }
  }, [floors, tableFloorId]);

  const handleFloorCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName) return;
    createFloor(newFloorName);
    setNewFloorName("");
    alert("New Floor created!");
  };

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFloorId || !tableNumber || !tableSeats) return;

    createTable({
      floorId: tableFloorId,
      tableNumber,
      seats: parseInt(tableSeats) || 4
    });

    setTableNumber("");
    setShowTableForm(false);
    alert(`Table ${tableNumber} created successfully!`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs text-stone-800 dark:text-stone-200">
      <div>
        <h2 className="text-2xl font-black text-stone-800 dark:text-stone-100 font-sans">Cafe Table layouts & Floorplans</h2>
        <p className="text-stone-500 mt-0.5">Design zones/floors and add customer dining tables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Floor Plan Creator */}
        <div className="p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Add Floor Location Zone</h3>
          <form onSubmit={handleFloorCreate} className="space-y-4">
            <div>
              <label className="block text-stone-400 font-bold mb-1">Zone Name</label>
              <input
                type="text"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="e.g. Balcony Patio"
                className="w-full p-2 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-200"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors">
              Create Zone
            </button>
          </form>

          {/* List of zones */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <p className="font-bold text-[10px] text-stone-400 uppercase">Registered Zones:</p>
            {floors.map(f => (
              <div key={f.id} className="p-2 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg flex justify-between font-bold text-stone-700 dark:text-stone-300">
                <span>🏢 {f.name}</span>
                <span className="text-stone-400">ID #{f.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Creator */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-800 dark:text-stone-100">Dining Tables Setup</h3>
            <button
              onClick={() => setShowTableForm(!showTableForm)}
              className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors"
            >
              + Register Dining Table
            </button>
          </div>

          {showTableForm && (
            <form onSubmit={handleTableSubmit} className="p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-4 animate-fade-in">
              <h4 className="font-bold text-xs uppercase text-stone-400">New Table details</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Select Zone</label>
                  <select
                    value={tableFloorId}
                    onChange={(e) => setTableFloorId(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                  >
                    {floors.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Table Code/Number</label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. T-15"
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-205 dark:border-stone-800 rounded-xl text-stone-800 dark:text-stone-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1">Seats Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={tableSeats}
                    onChange={(e) => setTableSeats(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-stone-900 border border-stone-205 dark:border-stone-800 rounded-xl text-stone-850 dark:text-stone-150"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-hover transition-colors">
                Save Table
              </button>
            </form>
          )}

          {/* Grid of dining tables */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {tables.map((table) => {
              const floor = floors.find(f => f.id === table.floorId);
              
              return (
                <div
                  key={table.id}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                    table.status === "DIRTY"
                      ? "bg-amber-500/10 border-amber-300 dark:bg-amber-955/25 dark:border-amber-900"
                      : table.status === "OCCUPIED"
                      ? "bg-red-500/10 border-danger dark:bg-red-955/25 dark:border-red-900"
                      : "bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800 hover:shadow-md"
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] text-stone-400">
                    <span className="font-semibold uppercase tracking-wider">{floor ? floor.name : "Zone"}</span>
                    <span className="font-mono">Seats: {table.seats}</span>
                  </div>
                  <h4 className="font-black text-sm text-stone-800 dark:text-white">{table.tableNumber}</h4>
                  
                  <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-2.5">
                    <span className={`text-[10px] font-bold uppercase ${
                      table.status === "DIRTY"
                        ? "text-amber-600 dark:text-amber-400"
                        : table.status === "OCCUPIED"
                        ? "text-danger"
                        : "text-success"
                    }`}>
                      {table.status === "DIRTY" ? "Dirty 🧹" : table.status === "OCCUPIED" ? "Occupied 🍽️" : "Available"}
                    </span>
                    
                    {table.status === "DIRTY" && (
                      <button
                        onClick={() => toggleTableStatus(table.id)}
                        className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-success rounded text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Clean Table
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
