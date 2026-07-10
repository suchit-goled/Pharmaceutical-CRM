import { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";

interface Interaction {
  id: number;
  doctor: string;
  hospital: string;
  product: string;
  visitDate: string;
  sentiment: string;
}

export default function InteractionHistory() {

  const [data, setData] = useState<Interaction[]>([]);

  const loadData = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/interactions"
    );

    setData(res.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const deleteInteraction = async (id: number) => {

    await axios.delete(
      `http://127.0.0.1:8000/interaction/${id}`
    );

    loadData();

  };

  return (

    <DashboardLayout>

      <h1 className="text-3xl font-bold mb-6">

        Interaction History

      </h1>

      <table className="w-full bg-white rounded-xl shadow">

        <thead>

          <tr className="border-b">

            <th className="p-4">Doctor</th>

            <th>Hospital</th>

            <th>Product</th>

            <th>Date</th>

            <th>Sentiment</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {data.map((item) => (

            <tr key={item.id} className="border-b">

              <td className="p-4">{item.doctor}</td>

              <td>{item.hospital}</td>

              <td>{item.product}</td>

              <td>{item.visitDate}</td>

              <td>{item.sentiment}</td>

              <td>

                <button
                  className="text-red-600"
                  onClick={() =>
                    deleteInteraction(item.id)
                  }
                >

                  Delete

                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </DashboardLayout>

  );

}