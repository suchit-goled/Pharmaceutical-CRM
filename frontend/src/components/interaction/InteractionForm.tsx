import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
} from "lucide-react";
import axios from "axios";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateField } from "./interactionSlice";
import type { Interaction } from "../../types/interaction";

export default function InteractionForm() {
  const interaction = useAppSelector(
    (state) => state.interaction
  );

  const dispatch = useAppDispatch();
  const fields = [

    interaction.doctor,

    interaction.hospital,

    interaction.specialization,

    interaction.product,

    interaction.notes,

    interaction.summary,

    interaction.outcomes,

    interaction.followUp,

    interaction.attendees,

    interaction.visitDate,

    interaction.visitTime,

  ];

  const completed = fields.filter(

    (Boolean)

  ).length;

  const progress = Math.round(

    (completed / fields.length) * 100

  );

  const saveInteraction = async () => {
    try {

      await axios.post(
        "http://127.0.0.1:8000/save",
        interaction
      );

      alert("Interaction Saved Successfully");

    } catch (err) {

      console.error(err);

      alert("Failed to Save");

    }
  };

  const handleChange = (
    field: keyof Interaction,
    value: string | number
  ) => {
    dispatch(
      updateField({
        field,
        value,
      })
    );
  };

  return (
    <div className="space-y-6">

      {/* Page Title */}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Report
        </h2>
        <div className="mt-6">

          <div className="flex justify-between text-sm mb-2">

            <span className="font-medium">

              CRM Completion

            </span>

            <span>

              {progress}%

            </span>

          </div>

          <div className="h-3 bg-slate-200 rounded-full">

            <div

              style={{

                width: `${progress}%`

              }}

              className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-700"

            />

          </div>

        </div>

        <p className="text-slate-500 mt-1">
          Review and edit AI extracted interaction details before saving.
        </p>
      </div>

      {/* Healthcare Professional */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-center gap-2 mb-6">
          <Building2
            className="text-blue-600"
            size={20}
          />
          <h3 className="font-semibold text-lg">
            Healthcare Professional
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-5">

          <div>
            <div className="flex items-center justify-between">



{

interaction.doctor && (

<span

className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"

>

AI Filled

</span>

)

}

</div>
            <label className="text-sm font-medium">
              Doctor
            </label>

            <input
              value={interaction.doctor}
              onChange={(e) =>
                handleChange("doctor", e.target.value)
              }
              placeholder="Doctor Name"
              className={`mt-2 w-full rounded-xl border px-4 py-3 transition-all

${interaction.doctor

                  ?

                  "border-green-400 ring-2 ring-green-200"

                  :

                  "border-slate-300"

                }

`}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Hospital
            </label>

            <input
              value={interaction.hospital}
              onChange={(e) =>
                handleChange("hospital", e.target.value)
              }
              placeholder="Hospital"
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">
              Specialization
            </label>

            <input
              value={interaction.specialization}
              onChange={(e) =>
                handleChange(
                  "specialization",
                  e.target.value
                )
              }
              placeholder="Specialization"
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

        </div>

      </div>

      {/* Visit Details */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-center gap-2 mb-6">
          <Calendar
            className="text-blue-600"
            size={20}
          />

          <h3 className="font-semibold text-lg">
            Visit Details
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-5">

          <div>
            <label className="text-sm font-medium">
              Visit Date
            </label>

            <input
              type="date"
              value={interaction.visitDate}
              onChange={(e) =>
                handleChange(
                  "visitDate",
                  e.target.value
                )
              }
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Visit Time
            </label>

            <input
              type="time"
              value={interaction.visitTime}
              onChange={(e) =>
                handleChange(
                  "visitTime",
                  e.target.value
                )
              }
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Interaction Type
            </label>

            <input
              value={interaction.interactionType}
              onChange={(e) =>
                handleChange(
                  "interactionType",
                  e.target.value
                )
              }
              placeholder="Physical / Virtual"
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Attendees
            </label>

            <input
              value={interaction.attendees}
              onChange={(e) =>
                handleChange(
                  "attendees",
                  e.target.value
                )
              }
              placeholder="Doctor, Nurse..."
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Product
            </label>

            <input
              value={interaction.product}
              onChange={(e) =>
                handleChange(
                  "product",
                  e.target.value
                )
              }
              placeholder="Medicine"
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Samples
            </label>

            <input
              type="number"
              value={interaction.samples}
              onChange={(e) =>
                handleChange(
                  "samples",
                  Number(e.target.value)
                )
              }
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">
              Materials Shared
            </label>

            <input
              value={interaction.materials}
              onChange={(e) =>
                handleChange(
                  "materials",
                  e.target.value
                )
              }
              placeholder="Brochure, Study..."
              className="mt-2 w-full border border-slate-300 rounded-xl px-4 py-3"
            />
          </div>

        </div>

      </div>

      {/* Notes */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-center gap-2 mb-5">
          <ClipboardList
            size={20}
            className="text-blue-600"
          />

          <h3 className="font-semibold">
            Discussion Notes
          </h3>
        </div>

        <textarea
          rows={5}
          value={interaction.notes}
          onChange={(e) =>
            handleChange(
              "notes",
              e.target.value
            )
          }
          placeholder="Doctor feedback..."
          className="w-full border border-slate-300 rounded-xl p-4 resize-none"
        />

      </div>

      {/* Summary */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-center gap-2 mb-5">
          <FileText
            size={20}
            className="text-blue-600"
          />

          <h3 className="font-semibold">
            AI Summary
          </h3>
        </div>
<div className="mt-3 flex items-center gap-2">

<span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">

🎯 AI Confidence

</span>

<span className="font-bold">

{interaction.confidence}%

</span>

</div>
        <textarea
          rows={5}
          value={interaction.summary}
          onChange={(e) =>
            handleChange(
              "summary",
              e.target.value
            )
          }
          className="w-full border border-slate-300 rounded-xl p-4 resize-none"
        />

      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">

<div className="rounded-xl bg-slate-50 p-4">

<p className="text-sm text-slate-500">

Sentiment

</p>

<h3 className="font-bold">

{interaction.sentiment}

</h3>

</div>

<div className="rounded-xl bg-slate-50 p-4">

<p className="text-sm text-slate-500">

Priority

</p>

<h3 className="font-bold">

{interaction.suggestions.priority}

</h3>

</div>

<div className="rounded-xl bg-slate-50 p-4">

<p className="text-sm text-slate-500">

Compliance

</p>

<h3 className="font-bold">

{

interaction.compliance.ready

?

"Ready"

:

"Pending"

}

</h3>

</div>

</div>

      <button
        onClick={saveInteraction}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
      >
        Save Interaction
      </button>

    </div>
  );
}