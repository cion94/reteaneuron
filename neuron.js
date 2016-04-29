var fs = require('fs');
var netInput = [];
var netOutput = [];

var netInputLabels = [
"duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata",
"ora_0", "ora_1", "ora_2", "ora_3", "ora_4", "ora_5", "ora_6", "ora_7", "ora_8",
"ora_9", "ora_10", "ora_11", "ora_12", "ora_13", "ora_14", "ora_15", "ora_16", "ora_17",
"ora_18", "ora_19", "ora_20", "ora_21", "ora_22", "ora_23", "min_0", "min_10", "min_20", "min_30",
"min_40", "min_50"
];

var netOutputLabels = [
];

var trainLoad = {};

var str = fs.readFileSync('neurons.json');
trainLoad = JSON.parse(str);

var trainLoaded = false;
if( Object.keys(trainLoad).length > 0 )
	trainLoaded = true;

/*var netInputLabelsObj = {
"duminica" : 0, "luni" : 0, "marti" : 0, "miercuri" : 0, "joi" : 0, "vineri" : 0, "sambata" : 0,
"ora 0" : 0, "ora 1" : 0, "ora 2" : 0, "ora 3" : 0, "ora 4" : 0, "ora 5" : 0, "ora 6" : 0, "ora 7" : 0, "ora 8" : 0,
"ora 9" : 0, "ora 10" : 0, "ora 11" : 0, "ora 12" : 0, "ora 13" : 0, "ora 14" : 0, "ora 15" : 0, "ora 16" : 0, "ora 17" : 0,
"ora 18" : 0, "ora 19" : 0, "ora 20" : 0, "ora 21" : 0, "ora 22" : 0, "ora 23" : 0, "min 0" : 0, "min 10" : 0, "min 20" : 0, "min 30" : 0,
"min 40" : 0, "min 50" : 0
}; */

function LearningRule() {
	var root = this;
	this.netInput = [];
	this.netOutput = [];
	this.desiredOutput = [];
	this.trainConstant = 0.25;

	// populatia ce trece in iteratia urmatoare
	this.trainingSet = [];

	this.setInput = function( inputNeurons ) {
		root.netInput = inputNeurons;
	}
	this.setDesiredOutput = function( desiredOutput ) {
		root.desiredOutput = desiredOutput;
	}
	this.setNetworkOutput = function( output ) {
		root.netOutput = output;
	}
	this.setTrainingSet = function( neuronsTrainingSet ) {
		root.trainingSet = neuronsTrainingSet;
	}
	this.getTrainingSet = function() {
		return root.trainingSet;
	}

	var randomize = function() {
		for( var i = 0; i < root.trainingSet.length; i++ ) {
			root.trainingSet[i].randomize();
		}
	}

	var train = function() {
		for( var i = 0; i < root.trainingSet.length; i++ ) {
			root.trainingSet[i].train(root.netInput, root.desiredOutput[i], root.trainConstant );
		}
	}

	this.learn = function() {
		train();
	}
}


function Network() {

	var root = this;
	this.inputLayer = [];
	this.hiddenLayer = [];
	this.desiredOutput = [];
	this.startLearn = false;
	this.outputLayer = [];

	this.setInput = function( input ) {
		for( var i = 0; i < input.length; i++ ) {
			root.inputLayer.push(input[i]);
		}
	}

	this.addOutputLayer = function( num ) {
		for( var i = 0; i < num; i++ )
			root.outputLayer.push(0);
	}

	this.addNeurons = function( ) {
		if( root.outputLayer.length == 0 )
		{
			console.log("Add neurons error! Empty output layer..");
			return;
		}
		for( var i = 0; i < root.outputLayer.length; i++ )
		{
			var neuron = new Neuron();
			if( trainLoaded == false)
				neuron.randomize(root.inputLayer);
			else
			{
				var label = "n_" + i;
				var weights = trainLoad[label];
				if( !weights ) {
					neuron.randomize(root.inputLayer);
				}
				else {
					neuron.setWeights(weights);
				}
			}
			root.hiddenLayer.push(neuron);
		}
			
	}

	this.setDesiredOutput = function( output ) {
		for( var i = 0; i < output.length; i++ )
			root.desiredOutput.push(output[i]);
		root.startLearn = true;

	}

	this.setLearningRule = function( learningRule ) {
		root.LearningRule = learningRule;
	}

	this.updateWeights = function( trainingSet ) {
		if( trainingSet.length != root.hiddenLayer.length )
		{
			console.log("train erorr. more neurons than required!");
			return;
		}
		root.hiddenLayer = trainingSet;
	}

	var saveState = function() {
		var outJson = {};
		
		for( var i = 0; i < root.hiddenLayer.length; i++ ) {
			var label = "n_" + i;
			outJson[label] = root.hiddenLayer[i].weights;
		}

		fs.writeFileSync('neurons.json', JSON.stringify(outJson, null, 4));
	}

	this.start = function() {
		if( root.startLearn == true ) {
			var learningRule = new LearningRule();
			learningRule.setInput( root.inputLayer );
			learningRule.setDesiredOutput( root.desiredOutput );
			learningRule.setTrainingSet( root.hiddenLayer );
			learningRule.learn();
			root.updateWeights( learningRule.getTrainingSet() );
			saveState();
		}
		else
		{
			for( var i = 0; i < root.hiddenLayer.length; i++ ) {
				var output = root.hiddenLayer[i].compute(root.inputLayer);
				root.outputLayer[i] = output;
			}
			console.log(root.outputLayer);
		}
	}

}

function Neuron() {
	this.weights = [];
	var root = this;

	this.compute = function(inputs) {
		var sum = 0;
		for( var i = 0; i < inputs.length; i++ )
			sum += root.weights[i] * inputs[i];

		if( sum > 0 )
			return 1;
		else
			return -1;
	}

	this.randomize = function(inputs) {
		for(var  i = 0; i < inputs.length; i++) {
			// de facut random intre [-1, 1)
			root.weights.push(Math.random()*2-1);
		}
	}

	this.train = function(inputs, desiredOutput, trainConstant) {
		var output = root.compute(inputs);
		var err = desiredOutput - output;
		for( var i = 0; i < root.weights.length; i++ ) {
			root.weights[i] += trainConstant * err * inputs[i];
		}
	}

	this.setWeights = function( weights ) {
		for( var i = 0; i < weights.length; i++ ) {
			root.weights.push(weights[i]);
		}
	}
}

var input = [];
for( var i = 0; i < netInputLabels.length; i++ ) {
	input.push(0);
}
input[2] = 1;
input[10] = 1;

var desiredOutput = [];
desiredOutput.push(1);
desiredOutput.push(-1);
desiredOutput.push(1);
desiredOutput.push(-1);

var network = new Network();

network.setInput(input);
network.addOutputLayer(4);
network.addNeurons();
//network.setDesiredOutput(desiredOutput);

network.start();
