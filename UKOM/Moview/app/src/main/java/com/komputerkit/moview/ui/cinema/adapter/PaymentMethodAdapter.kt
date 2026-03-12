package com.komputerkit.moview.ui.cinema.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.komputerkit.moview.R
import com.komputerkit.moview.ui.cinema.model.PaymentMethod

class PaymentMethodAdapter(
    private val methods: List<PaymentMethod>,
    private val onSelected: (PaymentMethod) -> Unit
) : RecyclerView.Adapter<PaymentMethodAdapter.ViewHolder>() {

    private var selectedPosition = 0

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvLogo: TextView = view.findViewById(R.id.tv_payment_logo)
        val tvName: TextView = view.findViewById(R.id.tv_payment_name)
        val tvDesc: TextView = view.findViewById(R.id.tv_payment_desc)
        val tvPromo: TextView = view.findViewById(R.id.tv_promo_label)
        val rbSelect: RadioButton = view.findViewById(R.id.rb_select)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_payment_method, parent, false)
        return ViewHolder(v)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val method = methods[position]
        holder.tvLogo.text = method.name
        holder.tvName.text = method.name
        holder.tvDesc.text = method.description
        holder.rbSelect.isChecked = position == selectedPosition

        if (method.promoLabel != null) {
            holder.tvPromo.visibility = View.VISIBLE
            holder.tvPromo.text = method.promoLabel
        } else {
            holder.tvPromo.visibility = View.GONE
        }

        val clickListener = View.OnClickListener {
            val prev = selectedPosition
            selectedPosition = position
            notifyItemChanged(prev)
            notifyItemChanged(position)
            onSelected(method)
        }
        holder.itemView.setOnClickListener(clickListener)
        holder.rbSelect.setOnClickListener(clickListener)
    }

    override fun getItemCount() = methods.size

    fun getSelectedMethod(): PaymentMethod? =
        if (selectedPosition in methods.indices) methods[selectedPosition] else null
}
